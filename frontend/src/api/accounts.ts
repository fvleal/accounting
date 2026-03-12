import apiClient from './client';
import type { Account, ApiResponse } from '../types/account';

// GET /accounts/me
export function getMe(): Promise<Account> {
  return apiClient.get<ApiResponse<Account>>('/accounts/me').then((r) => r.data.data);
}

// POST /accounts (idempotent on email)
export function createAccount(data: { name: string; cpf: string }): Promise<Account> {
  return apiClient.post<ApiResponse<Account>>('/accounts', data).then((r) => r.data.data);
}

// PATCH /accounts/me
export function updateAccount(data: { name?: string; birthDate?: string }): Promise<Account> {
  return apiClient.patch<ApiResponse<Account>>('/accounts/me', data).then((r) => r.data.data);
}

// POST /accounts/me/phone/send-code
export function sendPhoneCode(phone: string): Promise<Account> {
  return apiClient
    .post<ApiResponse<Account>>('/accounts/me/phone/send-code', { phone })
    .then((r) => r.data.data);
}

// POST /accounts/me/phone/verify (501 Not Implemented)
export function verifyPhone(code: string): Promise<Account> {
  return apiClient
    .post<ApiResponse<Account>>('/accounts/me/phone/verify', { code })
    .then((r) => r.data.data);
}

// POST /accounts/me/photo
export function uploadPhoto(file: File): Promise<Account> {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient
    .post<ApiResponse<Account>>('/accounts/me/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data.data);
}
