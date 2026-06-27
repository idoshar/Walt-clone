const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function checkBackendHealth() {
  if (!API_BASE_URL) {
    throw new Error(
      'Missing EXPO_PUBLIC_API_BASE_URL. Add it to the mobile .env file.'
    );
  }

  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error(`Backend health check failed with status ${response.status}.`);
  }

  return response.json();
}
