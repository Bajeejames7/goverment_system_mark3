import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Enhanced error handling for API responses
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: any = null,
    public code?: string
  ) {
    super(`${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const errorData = await res.json();
      throw new ApiError(
        res.status,
        errorData.message || res.statusText,
        errorData,
        errorData.code
      );
    } catch (parseError) {
      // If JSON parsing fails, use text
      const text = await res.text().catch(() => res.statusText);
      throw new ApiError(res.status, text);
    }
  }
}

// Enhanced API request function with better error handling
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Use consistent token key
  const token = localStorage.getItem('auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(0, 'Network error - please check your connection', null, 'NETWORK_ERROR');
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, signal }) => {
    const token = localStorage.getItem('auth_token');
    
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        signal, // Support for cancellation
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Handle abort errors gracefully
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(0, 'Network error - please check your connection', null, 'NETWORK_ERROR');
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes (was cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        // Retry up to 2 times for network errors or 5xx errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on client errors
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        // Only retry once for server errors
        return failureCount < 1;
      },
    },
  },
});

// Enhanced mutation helper
export const createMutation = (endpoint: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST') => {
  return async (data?: any) => {
    const res = await apiRequest(method, endpoint, data);
    return res.json();
  };
};

// Helper for handling API errors in components
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Network error. Please check your internet connection.';
      case 'NOT_AUTHENTICATED':
        return 'Please log in to continue.';
      case 'INSUFFICIENT_PERMISSIONS':
        return 'You do not have permission to perform this action.';
      case 'VALIDATION_FAILED':
        return error.body?.errors ? 
          error.body.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ') :
          'Invalid input data.';
      default:
        return error.statusText || 'An error occurred.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred.';
};
