import { Platform } from 'react-native';

const defaultApiBaseUrl = Platform.select({
  android: 'http://10.0.2.2:3001',
  default: 'http://localhost:3001',
});
const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL || defaultApiBaseUrl || '').replace(/\/+$/, '');

const apiErrorMessages: Record<string, string> = {
  INVALID_LIMIT: 'The requested page size is invalid.',
  INVALID_CURSOR: 'This list position is no longer valid. Refresh and try again.',
  MISSING_PARAMETER: 'The request is missing required information.',
  NOT_FOUND: 'The requested story or chapter could not be found.',
  METHOD_NOT_ALLOWED: 'This request is not supported by the API.',
  INTERNAL: 'The service is temporarily unavailable. Please try again.',
};

interface ApiErrorEnvelope {
  error?: {
    code?: string;
  };
}

export async function getJson<T>(path: string): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error('Configure EXPO_PUBLIC_API_URL to connect to the Fanon API.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch (requestError) {
    const detail = requestError instanceof Error && requestError.name === 'AbortError'
      ? 'The request timed out.'
      : 'The server could not be reached.';
    throw new Error(`${detail} Start the companion API and verify ${apiBaseUrl}/health.`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let errorCode: string | undefined;
    try {
      const payload = (await response.json()) as ApiErrorEnvelope;
      errorCode = payload.error?.code;
    } catch {
      errorCode = undefined;
    }

    throw new Error(
      (errorCode && apiErrorMessages[errorCode]) || `The API returned ${response.status}. Please try again.`,
    );
  }

  return (await response.json()) as T;
}