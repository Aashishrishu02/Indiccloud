
import { IsEmail, MaxLength } from 'class-validator';

export class ValidateEmailDto {
  @IsEmail()
  @MaxLength(255)
  email: string;
}
