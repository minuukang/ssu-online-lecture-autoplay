import fetch, { RequestInit } from 'node-fetch';
import { logger } from '../helpers/log';

const baseApiUrl = 'https://canvas.ssu.ac.kr/learningx/api/v1';

export async function api<T>(url: string, token: string, init: RequestInit = {}): Promise<T> {
  init.headers = {
    ...init.headers,
    Authorization: `Bearer ${token}`,
  };
  const response = await fetch(`${baseApiUrl}${url}`, init);
  if (response.ok) {
    const result = await response.json();
    logger.info('fetch', {
      url,
      token,
      result,
      setCookie: response.headers.get('Set-Cookie')
    });
    return result as T;
  } else {
    logger.error({
      response: await response.text(),
      status: response.status,
    });
    throw response;
  }
}