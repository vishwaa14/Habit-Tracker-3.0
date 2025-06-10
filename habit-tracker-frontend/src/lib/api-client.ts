const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

interface RequestOptions extends RequestInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any; // For POST/PUT requests
}

async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { data, headers: customHeaders, ...customOptions } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    method: options.method || (data ? 'POST' : 'GET'), // Default to POST if data is provided, else GET
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
      // Authorization: `Bearer ${token}` // Will be added when JWT is implemented
    },
    ...customOptions,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    // Handle cases where response might be empty (e.g., 204 No Content for DELETE)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json() as Promise<T>;
    } else {
      // If not JSON, return null or handle as text. For this app, most responses will be JSON.
      // For a DELETE request that returns 204, response.json() would fail.
      // Consider response.text() or just returning null/undefined if appropriate.
      return null as unknown as T; // Or handle based on status code, e.g. 204
    }

  } catch (error) {
    console.error('API Client Error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred during the API request.');
  }
}

export default apiClient;
