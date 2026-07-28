import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isAdminRequestPath } from "@/lib/admin/path";

import { publicSupabaseConfig } from "./config";
import type { Database } from "./database.types";

function hiddenRouteResponse() {
  return new NextResponse("Not Found", {
    status: 404,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!publicSupabaseConfig) {
    return response;
  }

  const supabase = createServerClient<Database>(
    publicSupabaseConfig.url,
    publicSupabaseConfig.anonKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet, headers) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([name, value]) => {
            response.headers.set(name, value);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAdminRequestPath(request.nextUrl.pathname)) {
    if (!user) return hiddenRouteResponse();
    const { data: isAdmin, error } = await supabase.rpc("is_admin");
    if (error || !isAdmin) return hiddenRouteResponse();
  }

  return response;
}
