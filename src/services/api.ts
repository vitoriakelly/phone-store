const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3333';

interface ApiValidationError {
  field?: string;
  message?: string;
}

interface ApiErrorResponse {
  message?: string;

  errors?:
    | Record<string, string[]>
    | ApiValidationError[];

  formErrors?: string[];
}

function normalizeValidationErrors(
  errors:
    | Record<string, string[]>
    | ApiValidationError[]
    | undefined,
): Record<string, string[]> | undefined {
  if (!errors) {
    return undefined;
  }

  if (!Array.isArray(errors)) {
    return errors;
  }

  const normalizedErrors: Record<
    string,
    string[]
  > = {};

  errors.forEach((error) => {
    if (!error.field || !error.message) {
      return;
    }

    if (!normalizedErrors[error.field]) {
      normalizedErrors[error.field] = [];
    }

    normalizedErrors[error.field].push(
      error.message,
    );
  });

  return Object.keys(normalizedErrors).length > 0
    ? normalizedErrors
    : undefined;
}

function extractFormErrors(
  response?: ApiErrorResponse,
): string[] | undefined {
  const formErrors = [
    ...(response?.formErrors ?? []),
  ];

  if (Array.isArray(response?.errors)) {
    response.errors.forEach((error) => {
      if (!error.field && error.message) {
        formErrors.push(error.message);
      }
    });
  }

  return formErrors.length > 0
    ? formErrors
    : undefined;
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

    this.errors =
      normalizeValidationErrors(
        response?.errors,
      );

    this.formErrors =
      extractFormErrors(response);
  }
}

async function parseResponse<T>(
  response: Response,
): Promise<
  T | ApiErrorResponse | undefined
> {
  const responseText =
    await response.text();

  if (!responseText) {
    return undefined;
  }

  const contentType =
    response.headers.get(
      'content-type',
    );

  if (
    contentType?.includes(
      'application/json',
    )
  ) {
    try {
      return JSON.parse(
        responseText,
      ) as T | ApiErrorResponse;
    } catch {
      throw new ApiError(
        'A API retornou uma resposta JSON inválida.',
        response.status,
      );
    }
  }

  return {
    message: responseText,
  };
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,

      credentials: 'include',

      headers: {
        'Content-Type':
          'application/json',

        ...options.headers,
      },
    },
  );

  if (response.status === 204) {
    return undefined as T;
  }

  const responseData =
    await parseResponse<T>(response);

  if (!response.ok) {
    const errorResponse =
      (responseData ??
        {}) as ApiErrorResponse;

    throw new ApiError(
      errorResponse.message ??
        'Não foi possível concluir a solicitação.',
      response.status,
      errorResponse,
    );
  }

  return responseData as T;
}