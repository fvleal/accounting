export interface Account {
  id: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: string | null;
  phone: string | null;
  phoneVerified: boolean;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiMeta {
  timestamp: string;
}

export interface ListMeta extends ApiMeta {
  total: number;
  offset: number;
  limit: number;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: ListMeta;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
}
