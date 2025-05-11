import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: data ? { 
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    } : {
      "X-Requested-With": "XMLHttpRequest"
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    mode: "cors",
    cache: "no-cache",
    redirect: "follow"
  };

  console.log(`APIリクエスト送信: ${method} ${url}`);
  const res = await fetch(url, options);
  console.log(`APIレスポンス: ${res.status} ${res.statusText}`);

  if (!res.ok) {
    try {
      const errorData = await res.json();
      console.error("APIエラー:", errorData);
    } catch (e) {
      console.error("APIエラーの詳細を取得できませんでした");
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`クエリ実行: ${queryKey[0]}`);
    
    const requestOptions: RequestInit = {
      credentials: "include",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json"
      },
      mode: "cors",
      cache: "no-cache"
    };
    
    const res = await fetch(queryKey[0] as string, requestOptions);
    console.log(`クエリレスポンス: ${queryKey[0]} - ${res.status}`);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log("認証エラー - 空のレスポンスを返します", queryKey[0]);
      return null;
    }

    if (!res.ok) {
      try {
        const errorText = await res.text();
        console.error(`クエリエラー: ${queryKey[0]} - ${res.status}`, errorText);
      } catch (e) {
        console.error(`クエリエラー: ${queryKey[0]} - ${res.status}`, "エラー詳細を取得できませんでした");
      }
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    return data;
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
