const API_BASE_URL = 'http://localhost:8080';

export const fetchInstance = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };
  
    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    };
  
    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Something went wrong');
      }
  
      const text = await response.text();
      return text ? JSON.parse(text) as T : ({} as T); // Handle empty responses
    } catch (error) {
      console.error(`Error in fetch: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  };
  