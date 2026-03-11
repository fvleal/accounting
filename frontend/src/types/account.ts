export interface Account {
  id: string;
  fullName: string;
  email: string;
  cpf: string;
  dateOfBirth: string | null;
  phone: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
