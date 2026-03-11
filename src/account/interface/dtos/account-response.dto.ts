export class AccountResponseDto {
  id!: string;
  name!: string;
  email!: string;
  cpf!: string;
  birthDate!: string | null;
  phone!: string | null;
  phoneVerified!: boolean;
  photoUrl!: string | null;
  createdAt!: string;
  updatedAt!: string;

  static fromOutput(output: {
    id: string;
    name: string;
    email: string;
    cpf: string;
    birthDate: Date | null;
    phone: string | null;
    photoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): AccountResponseDto {
    const dto = new AccountResponseDto();
    dto.id = output.id;
    dto.name = output.name;
    dto.email = output.email;
    dto.cpf = output.cpf;
    dto.birthDate = output.birthDate?.toISOString() ?? null;
    dto.phone = output.phone;
    dto.phoneVerified = false;
    dto.photoUrl = output.photoUrl;
    dto.createdAt = output.createdAt.toISOString();
    dto.updatedAt = output.updatedAt.toISOString();
    return dto;
  }
}
