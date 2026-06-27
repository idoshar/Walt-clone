const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export class ApiError extends Error {
  constructor(message, { status = null, code = null, details = null } = {}) {
    super(message);

    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function getApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new ApiError(
      'Missing EXPO_PUBLIC_API_BASE_URL. Add it to the mobile .env file.'
    );
  }

  return API_BASE_URL.replace(/\/+$/, '');
}

function buildUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

async function readResponseBody(response) {
  const contentType = response.headers.get('content-type') || '';

  if (response.status === 204) {
    return null;
  }

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
}

function getErrorMessage(responseBody, fallbackMessage) {
  if (responseBody && typeof responseBody === 'object') {
    if (
      typeof responseBody.message === 'string' &&
      responseBody.message.trim()
    ) {
      return responseBody.message;
    }

    if (
      typeof responseBody.error === 'string' &&
      responseBody.error.trim()
    ) {
      return responseBody.error;
    }
  }

  if (typeof responseBody === 'string' && responseBody.trim()) {
    return responseBody;
  }

  return fallbackMessage;
}

export async function apiRequest(
  path,
  { method = 'GET', token, body, headers = {}, signal } = {}
) {
  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  const options = {
    method,
    headers: requestHeaders,
    signal,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined && body !== null) {
    requestHeaders['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;

  try {
    response = await fetch(buildUrl(path), options);
  } catch (error) {
    throw new ApiError(
      'Could not connect to the backend. Check that the server is running and that the API URL is correct.',
      {
        code: 'NETWORK_ERROR',
        details: error,
      }
    );
  }

  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(
        responseBody,
        `Request failed with status ${response.status}.`
      ),
      {
        status: response.status,
        code:
          responseBody &&
          typeof responseBody === 'object' &&
          typeof responseBody.error === 'string'
            ? responseBody.error
            : null,
        details: responseBody,
      }
    );
  }

  return responseBody;
}
