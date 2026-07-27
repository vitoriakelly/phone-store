const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
  formErrors?: string[];
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  formErrors?: string[];

  constructor(
    message: string,
    status: number,
    response?: ApiErrorResponse,
  ) {
    super(message);

    this.name = 'ApiError';
    this.status = status;
    this.errors = response?.errors;
    this.formErrors = response?.formErrors;
  }
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,

    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const responseData = (await response.json()) as
    | T
    | ApiErrorResponse;

  if (!response.ok) {
    const errorResponse = responseData as ApiErrorResponse;

    throw new ApiError(
      errorResponse.message ??
        'Não foi possível concluir a solicitação.',
      response.status,
      errorResponse,
    );
  }

  return responseData as T;
}