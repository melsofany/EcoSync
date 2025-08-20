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
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  try {
    const options: RequestInit = {
      method: method.toUpperCase().trim(), // التأكد من أن method صحيح
      credentials: "include",
      headers: {
        "Accept": "application/json"
      } as HeadersInit
    };
    
    if (data) {
      options.headers = { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      };
      options.body = JSON.stringify(data);
    }
    
    console.log(`📡 API Request: ${method} ${url}`);
    
    const res = await fetch(url, options);
    
    await throwIfResNotOk(res);
    
    // إذا كان هناك محتوى، قم بتحليله
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
    
    return res;
  } catch (error: any) {
    console.error(`❌ API Request Error: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // تحويل queryKey إلى URL صحيح - أخذ العنصر الأول إذا كان مصفوفة
    const url = Array.isArray(queryKey) ? String(queryKey[0]) : String(queryKey);
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
      queryFn: getQueryFn({ on401: "returnNull" }), // تغيير لإرجاع null بدلاً من throw
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // 10 دقائق 
      retry: false, // عدم إعادة المحاولة للبساطة
    },
    mutations: {
      retry: false,
    },
  },
});
