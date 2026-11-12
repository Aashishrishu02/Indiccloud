
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

  // REGISTER USER WITHOUT EMAIL OTP
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
        emailVerifiedAt: new Date(),
      },
    });

    return {
      message: 'Registration successful. You can now log in.',
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  // VERIFY EMAIL - DISABLED
  async verifyEmail(_dto: VerifyEmailDto) {
    throw new BadRequestException(
      'Email OTP verification is currently disabled.',
    );
  }

  // RESEND REGISTRATION OTP - DISABLED
  async resendOtp(_dto: ResendOtpDto) {
    throw new BadRequestException(
      'Email OTP verification is currently disabled.',
    );
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

  // GET LOGGED-IN USER PROFILE
  async getProfile(userId: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerifiedAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'User account not found or inactive',
      );
    }

    return user;
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
