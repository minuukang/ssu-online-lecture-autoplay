import fetch, { RequestInit } from 'node-fetch';

const baseApiUrl = 'https://canvas.ssu.ac.kr/learningx/api/v1';

export async function api<T>(url: string, token: string, init: RequestInit = {}): Promise<T> {
  init.headers = {
    ...init.headers,
    Authorization: `Bearer ${token}`,
  };
  const response = await fetch(`${baseApiUrl}${url}`, init);
  const result = await response.json();
  return result as T;
}