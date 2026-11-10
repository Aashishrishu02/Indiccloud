
import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { randomInt } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from '../email/email.service.js';

import { RegisterDto } from './dto/register.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ValidateEmailDto } from './dto/validate-email.dto.js';

import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { VerifyPasswordOtpDto } from './dto/verify-password-otp.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  // CHECK EMAIL AVAILABILITY
  async validateEmail(dto: ValidateEmailDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return {
      emailTaken: !!existingUser,
    };
  }

  // REGISTER USER AND SEND EMAIL OTP
  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: `${dto.firstName.trim()} ${dto.lastName.trim()}`,
        email,
        passwordHash,
      },
    });

    const otp = randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 12);

    const otpRecord = await this.prisma.emailVerificationOtp.create({
      data: {
        userId: user.id,
        otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    try {
      await this.emailService.sendOtpEmail(email, otp);
    } catch (error) {
      await this.prisma.emailVerificationOtp.delete({
        where: { id: otpRecord.id },
      });

      throw error;
    }

    return {
      message: 'Verification OTP sent to your email. Please check.',
    };
  }

  // VERIFY REGISTRATION OTP
  async verifyEmail(dto: VerifyEmailDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerifiedAt) {
      throw new BadRequestException('Email is already verified');
    }

    const otpRecord = await this.prisma.emailVerificationOtp.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('OTP expired or not found');
    }

    const isValidOtp = await bcrypt.compare(
      dto.otp,
      otpRecord.otpHash,
    );

    if (!isValidOtp) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationOtp.update({
        where: { id: otpRecord.id },
        data: { usedAt: new Date() },
      }),

      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      verified: true,
    };
  }

  // RESEND REGISTRATION OTP
  async resendOtp(dto: ResendOtpDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerifiedAt) {
      throw new BadRequestException('Email is already verified');
    }

    await this.prisma.emailVerificationOtp.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    const otp = randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 12);

    const otpRecord = await this.prisma.emailVerificationOtp.create({
      data: {
        userId: user.id,
        otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    try {
      await this.emailService.sendOtpEmail(email, otp);
    } catch (error) {
      await this.prisma.emailVerificationOtp.delete({
        where: { id: otpRecord.id },
      });

      throw error;
    }

    return {
      message: 'A new OTP has been sent to your email.',
      email,
    };
  }

  // STANDARD PASSWORD LOGIN
  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException(
        'Please verify your email before login',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account is inactive');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token: accessToken,
      reseller: false,
    };
  }

  // FORGOT PASSWORD - SEND OTP
  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    const message =
      'If an account with this email exists, an OTP has been sent.';

    if (!user) {
      return { message };
    }

    await this.prisma.passwordResetOtp.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    const otp = randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 12);

    const otpRecord = await this.prisma.passwordResetOtp.create({
      data: {
        userId: user.id,
        otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    try {
      await this.emailService.sendOtpEmail(email, otp);
    } catch (error) {
      await this.prisma.passwordResetOtp.delete({
        where: { id: otpRecord.id },
      });

      throw error;
    }

    return { message };
  }

  // VERIFY PASSWORD RESET OTP
  async verifyPasswordOtp(dto: VerifyPasswordOtpDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    const otpRecord = await this.prisma.passwordResetOtp.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (
      !otpRecord ||
      !(await bcrypt.compare(dto.otp, otpRecord.otpHash))
    ) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    return {
      message: 'OTP verified successfully.',
    };
  }

  // RESET PASSWORD
  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.trim().toLowerCase();

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    const otpRecord = await this.prisma.passwordResetOtp.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (
      !otpRecord ||
      !(await bcrypt.compare(dto.otp, otpRecord.otpHash))
    ) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),

      this.prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return {
      message: 'Password has been reset successfully.',
    };
  }
}
