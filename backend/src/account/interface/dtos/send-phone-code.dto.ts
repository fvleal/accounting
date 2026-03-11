import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class SendPhoneCodeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[1-9]{2}[2-9]\d{7,8}$/, {
    message:
      'phone must be a valid Brazilian phone number (DDD + 8 or 9 digits, e.g. 11987654321)',
  })
  phone!: string;
}
