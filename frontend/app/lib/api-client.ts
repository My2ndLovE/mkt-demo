import axios, { type AxiosInstance, type AxiosError } from 'axios';

/**
 * API error class for type-safe error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Create configured axios instance
 */
function createApiClient(): AxiosInstance {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const client = axios.create({
    baseURL,
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Add auth token if available
      const token = localStorage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Handle common error scenarios
      if (error.response) {
        const { status, data } = error.response;

        // Handle unauthorized (401)
        if (status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }

        // Handle forbidden (403)
        if (status === 403) {
          throw new ApiError(
            'You do not have permission to perform this action',
            status,
            data
          );
        }

        // Handle not found (404)
        if (status === 404) {
          throw new ApiError('Resource not found', status, data);
        }

        // Handle server errors (5xx)
        if (status >= 500) {
          throw new ApiError(
            'Server error. Please try again later.',
            status,
            data
          );
        }

        // Handle other errors
        const message =
          (data as { message?: string })?.message || 'An error occurred';
        throw new ApiError(message, status, data);
      }

      // Handle network errors
      if (error.request) {
        throw new ApiError(
          'Network error. Please check your connection.',
          undefined,
          error
        );
      }

      // Handle other errors
      throw new ApiError(error.message || 'An unexpected error occurred');
    }
  );

  return client;
}

/**
 * Singleton API client instance
 */
export const apiClient = createApiClient();

/**
 * API client configuration
 */
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000,
} as const;
