import { api } from './base';

export type Term = { default: boolean; end_at: string | null, id: number; name: string; start_at: string; workflow_state: string }

export function terms (userId: string, token: string) {
  return api<{ enrollment_terms: Term[] }>(`/users/${userId}/terms`, token);
}