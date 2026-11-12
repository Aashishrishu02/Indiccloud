
import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';

import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

import { RegisterDto } from './dto/register.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ValidateEmailDto } from './dto/validate-email.dto.js';

import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { VerifyPasswordOtpDto } from './dto/verify-password-otp.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // CHECK EMAIL AVAILABILITY
  @Post('register/validate')
  async validateEmail(@Body() dto: ValidateEmailDto) {
    return this.authService.validateEmail(dto);
  }

  // REGISTER
  @Post('register/initiate-verification')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  async initiateVerification(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // VERIFY REGISTRATION OTP
  @Post('register/complete-registration')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  async completeRegistration(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  // RESEND REGISTRATION OTP
  @Post('register/resend-otp')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  // LOGIN
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // GET LOGGED-IN USER PROFILE
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.sub);
  }

  // FORGOT PASSWORD
  @Post('password/forgot')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // VERIFY PASSWORD RESET OTP
  @Post('password/verify-otp')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  async verifyPasswordOtp(@Body() dto: VerifyPasswordOtpDto) {
    return this.authService.verifyPasswordOtp(dto);
  }

  // RESET PASSWORD
  @Post('password/reset')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
