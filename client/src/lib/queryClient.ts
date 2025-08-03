import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    let errorDetails = null;
    try {
      // Clone the response to avoid "body stream already read" error
      const responseClone = res.clone();
      const errorData = await responseClone.json();
      errorMessage = errorData.message || res.statusText;
      errorDetails = errorData.details;
      const error = new Error(errorMessage);
      (error as any).status = res.status;
      (error as any).error = errorData.error;
      (error as any).details = errorDetails;
      (error as any).existingItem = errorData.existingItem;
      (error as any).response = res;
      throw error;
    } catch (parseError) {
      // If JSON parsing fails, try to get text
      try {
        const responseClone = res.clone();
        const text = await responseClone.text();
        const error = new Error(`${res.status}: ${text || res.statusText}`);
        (error as any).response = res;
        throw error;
      } catch (textError) {
        const error = new Error(`${res.status}: ${res.statusText}`);
        (error as any).response = res;
        throw error;
      }
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
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
