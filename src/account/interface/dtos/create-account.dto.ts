import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: 'CPF must be 11 digits or formatted as XXX.XXX.XXX-XX',
  })
  cpf!: string;
}
