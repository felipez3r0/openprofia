import type { IApiResponse, IErrorResponse } from '@/types';
import { API_PREFIX } from '@/config/constants';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private url(path: string): string {
    return `${this.baseUrl}${API_PREFIX}${path}`;
  }

  private async handleResponse<T>(
    response: Response,
  ): Promise<IApiResponse<T>> {
    if (!response.ok) {
      const error: IErrorResponse = await response.json().catch(() => ({
        statusCode: response.status,
        error: response.statusText,
        message: 'An unexpected error occurred',
      }));
      return { success: false, error: error.message };
    }
    const body = await response.json();
    // Support both wrapped { success, data } and raw responses
    if (body && typeof body === 'object' && 'success' in body) {
      return body as IApiResponse<T>;
    }
    return { success: true, data: body as T };
  }

  async get<T>(path: string): Promise<IApiResponse<T>> {
    const response = await fetch(this.url(path), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, body: unknown): Promise<IApiResponse<T>> {
    const response = await fetch(this.url(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(path: string, body: unknown): Promise<IApiResponse<T>> {
    const response = await fetch(this.url(path), {
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
    const response = await fetch(this.url(path), {
      method: 'POST',
      body: formData,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(path: string): Promise<IApiResponse<T>> {
    const response = await fetch(this.url(path), {
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
    const response = await fetch(this.url(path), {
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
    const response = await fetch(`${this.baseUrl}${path}`, {
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
