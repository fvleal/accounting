import { IsString, IsOptional, Length, Matches } from 'class-validator';

export class UpdateAccountDto {
  @IsString()
  @IsOptional()
  @Length(2, 200)
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'birthDate must be YYYY-MM-DD format',
  })
  birthDate?: string;
}
