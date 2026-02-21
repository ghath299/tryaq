import { QueryClient, QueryFunction } from "@tanstack/react-query";

export function getApiUrl() {
  const explicitUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicitUrl && explicitUrl.length > 3) {
    return explicitUrl.replace(/\/+$/, "");
  }

  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain && domain.length > 3) {
    const clean = domain
      .trim()
      .replace("https://", "")
      .replace("http://", "")
      .replace(/\/+$/, "");
    return `https://${clean}`;
  }

  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    const firstDomain = replitDomains.split(",")[0].trim();
    if (firstDomain.length > 3) {
      return `https://${firstDomain}`;
    }
  }

  if (typeof window !== "undefined" && window.location?.hostname) {
    return `https://${window.location.hostname}`;
  }

  return "http://localhost:5000";
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const cleanRoute = route.startsWith("/") ? route : `/${route}`;
  const url = `${baseUrl}${cleanRoute}`;

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
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
    const baseUrl = getApiUrl();
    const route = queryKey.join("/");
    const cleanRoute = route.startsWith("/") ? route : `/${route}`;
    const url = `${baseUrl}${cleanRoute}`;

    const res = await fetch(url);

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
