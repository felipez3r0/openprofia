import type { IApiResponse, IErrorResponse } from '@/types';
import { API_PREFIX } from '@/config/constants';

// Detecta se está rodando no Tauri
const isTauri = (() => {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.__TAURI_INTERNALS__ !== 'undefined'
    );
  } catch {
    return false;
  }
})();

// Usa fetch nativo ou Tauri fetch conforme o ambiente
const getFetch = async (): Promise<typeof fetch> => {
  if (isTauri) {
    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
    return tauriFetch;
  }
  return fetch;
};

export class ApiClient {
  private baseUrl: string;
  private fetchFn: typeof fetch | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async ensureFetch(): Promise<typeof fetch> {
    if (!this.fetchFn) {
      this.fetchFn = await getFetch();
    }
    return this.fetchFn;
  }

  private url(path: string): string {
    return `${this.baseUrl}${API_PREFIX}${path}`;
  }

  private async handleResponse<T>(
    response: Response,
  ): Promise<IApiResponse<T>> {
    const isOk =
      (response as any).ok !== false && (response as any).status < 400;

    if (!isOk) {
      try {
        const text = await response.text();
        const error: IErrorResponse = JSON.parse(text);
        return { success: false, error: error.message };
      } catch (_e) {
        return {
          success: false,
          error: `HTTP Error`,
        };
      }
    }

    try {
      const text = await response.text();
      const body = JSON.parse(text);

      if (body && typeof body === 'object' && 'success' in body) {
        return body as IApiResponse<T>;
      }

      return { success: true, data: body as T };
    } catch (e) {
      return {
        success: false,
        error: `Parse error`,
      };
    }
  }

  async get<T>(path: string): Promise<IApiResponse<T>> {
    const fullUrl = this.url(path);
    console.log('[ApiClient] GET request:', fullUrl);
    console.log('[ApiClient] isTauri:', isTauri);
    console.log('[ApiClient] baseUrl:', this.baseUrl);
    try {
      const fetchFn = await this.ensureFetch();
      console.log('[ApiClient] Fetch function obtained, making request...');
      const response = await fetchFn(fullUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('[ApiClient] GET response:', {
        url: fullUrl,
        status: response.status,
        ok: response.ok,
      });
      const result = await this.handleResponse<T>(response);
      console.log('[ApiClient] Response handled:', result);
      return result;
    } catch (error) {
      console.error('[ApiClient] GET fetch error:', error);
      console.error('[ApiClient] Error for URL:', fullUrl);
      console.error('[ApiClient] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error,
      });
      throw error;
    }
  }

  async post<T>(path: string, body: unknown): Promise<IApiResponse<T>> {
    const fetchFn = await this.ensureFetch();
    const response = await fetchFn(this.url(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(path: string, body: unknown): Promise<IApiResponse<T>> {
    const fetchFn = await this.ensureFetch();
    const response = await fetchFn(this.url(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  async postFormData<T>(
    path: string,
    formData: FormData,
  ): Promise<IApiResponse<T>> {
    const fetchFn = await this.ensureFetch();
    const response = await fetchFn(this.url(path), {
      method: 'POST',
      body: formData,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(path: string): Promise<IApiResponse<T>> {
    const fetchFn = await this.ensureFetch();
    const response = await fetchFn(this.url(path), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 204) {
      return { success: true };
    }
    return this.handleResponse<T>(response);
  }

  async postStream(
    path: string,
    body: unknown,
    signal?: AbortSignal,
  ): Promise<ReadableStream<Uint8Array>> {
    const fetchFn = await this.ensureFetch();
    const response = await fetchFn(this.url(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    if (!response.ok || !response.body) {
      const error: IErrorResponse = await response.json().catch(() => ({
        statusCode: response.status,
        error: response.statusText,
        message: 'Stream connection failed',
      }));
      throw new Error(error.message);
    }
    return response.body;
  }

  async healthCheck<T>(path: string): Promise<IApiResponse<T>> {
    const fetchFn = await this.ensureFetch();
    const response = await fetchFn(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      return { success: false, error: response.statusText };
    }
    const data = (await response.json()) as T;
    return { success: true, data };
  }
}
