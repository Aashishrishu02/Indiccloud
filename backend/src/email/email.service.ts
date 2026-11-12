
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  async sendOtpEmail(email: string, otp: string) {
    // Development-only OTP testing
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(
        `[DEV OTP] Email: ${email} | OTP: ${otp}`,
      );

      return { success: true, mode: 'development' };
    }

    // Production email delivery
    const { data, error } = await this.resend.emails.send({
      from: '24/7 <onboarding@resend.dev>',
      to: [email],
      subject: '24/7 - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px;">
          <h2>Welcome to 24/7!</h2>
          <p>Your email verification OTP is:</p>
          <h1 style="letter-spacing: 8px;">${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
          <p>Please do not share your OTP with anyone.</p>
        </div>
      `,
    });

    if (error) {
      this.logger.error('Resend email error:', error);
      throw new InternalServerErrorException(
        'Unable to send verification email',
      );
    }

    return data;
  }
}
