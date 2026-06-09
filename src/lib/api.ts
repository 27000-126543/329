import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse } from './types';

const USER_STORAGE_KEY = 'user';

interface StoredUser {
  id: string;
  [key: string]: unknown;
}

function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const user = getStoredUser();
    if (user?.id) {
      config.headers.set('x-user-id', user.id);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  <T>(response: AxiosResponse<ApiResponse<T>>) => {
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    const status = error.response?.status;
    const errorData = error.response?.data;

    if (status === 401) {
      localStorage.removeItem(USER_STORAGE_KEY);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    const enhancedError = {
      ...error,
      message:
        errorData?.error ||
        errorData?.message ||
        error.message ||
        '请求失败，请稍后重试',
      statusCode: status,
      raw: error,
    };

    return Promise.reject(enhancedError);
  }
);

export async function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<ApiResponse<T>>(config);
  const body = response.data;

  if (!body) {
    throw new Error('响应数据为空');
  }

  if (!body.success) {
    const err = new Error(body.error || body.message || '请求失败');
    (err as Error & { code?: number }).name = 'ApiError';
    throw err;
  }

  return body.data as T;
}

export async function get<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({ ...config, method: 'GET', url });
}

export async function post<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({ ...config, method: 'POST', url, data });
}

export async function put<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({ ...config, method: 'PUT', url, data });
}

export async function del<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({ ...config, method: 'DELETE', url });
}

export async function patch<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({ ...config, method: 'PATCH', url, data });
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export async function uploadFile<T = unknown>(
  url: string,
  file: File,
  fieldName: string = 'file',
  onProgress?: (progress: UploadProgress) => void,
  extraData?: Record<string, unknown>
): Promise<T> {
  const formData = new FormData();
  formData.append(fieldName, file);

  if (extraData) {
    Object.entries(extraData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
  }

  const response = await api.post<ApiResponse<T>>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const total = progressEvent.total || 0;
        const loaded = progressEvent.loaded || 0;
        onProgress({
          loaded,
          total,
          percentage: Math.round((loaded * 100) / total),
        });
      }
    },
  });

  const body = response.data;
  if (!body?.success) {
    throw new Error(body?.error || body?.message || '上传失败');
  }

  return body.data as T;
}

export default api;
