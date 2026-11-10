
import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service.js';

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

  @Post('register/validate')
  async validateEmail(@Body() dto: ValidateEmailDto) {
    return this.authService.validateEmail(dto);
  }

  @Post('register/initiate-verification')
  async initiateVerification(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('register/complete-registration')
  async completeRegistration(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('register/resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('password/forgot')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('password/verify-otp')
  async verifyPasswordOtp(@Body() dto: VerifyPasswordOtpDto) {
    return this.authService.verifyPasswordOtp(dto);
  }

  @Post('password/reset')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
