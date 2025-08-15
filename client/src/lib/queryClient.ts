import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Try to parse JSON response first
      const errorData = await res.json();
      console.log("Parsed error data from server:", errorData);
      const error = new Error(errorData.message || res.statusText);
      (error as any).status = res.status;
      (error as any).details = errorData.details;
      (error as any).data = errorData; // Include full error data for duplicate handling
      (error as any).serverError = errorData;
      console.log("Created error object:", error);
      throw error;
    } catch (parseError) {
      console.log("Failed to parse JSON error, using fallback");
      // If JSON parsing fails, create simple error
      const error = new Error(`HTTP ${res.status}: ${res.statusText}`);
      (error as any).status = res.status;
      throw error;
    }
  }
}

export async function apiRequest(
  url: string,
  method: string = 'GET',
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`🚀 [apiRequest] ${method} ${url}`);
  console.log(`🍪 [apiRequest] Document cookies:`, document.cookie);
  console.log(`📦 [apiRequest] Request data:`, data ? JSON.stringify(data).substring(0, 100) + '...' : 'none');
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  console.log(`📡 [apiRequest] Response status: ${res.status}`);
  console.log(`🔍 [apiRequest] Response headers:`, Object.fromEntries(res.headers.entries()));

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // تحويل queryKey إلى URL صحيح - أخذ العنصر الأول إذا كان مصفوفة
    const url = Array.isArray(queryKey) ? queryKey[0] as string : queryKey as string;
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
