import { api } from './base';

export type Term = { default: boolean; end_at: string | null, id: number; name: string; start_at: string; workflow_state: string }

export function terms (token: string) {
  return api<{ enrollment_terms: Term[] }>(`/accounts/terms`, token);
}