import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { safeAuthRedirect } from "@/lib/auth/redirect";
import { publicSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function readEmailOtpType(value: string | null): EmailOtpType | null {
  return value && EMAIL_OTP_TYPES.has(value) ? value : null;
}

function redirectWithinOrigin(location: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: location },
  });
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = readEmailOtpType(request.nextUrl.searchParams.get("type"));
  const next = safeAuthRedirect(request.nextUrl.searchParams.get("next"));
  const cookiesToSet: Array<{
    name: string;
    value: string;
    options: CookieOptions;
  }> = [];
  const authHeaders: Record<string, string> = {};
  const supabase = publicSupabaseConfig
    ? createServerClient<Database>(
        publicSupabaseConfig.url,
        publicSupabaseConfig.anonKey,
        {
          cookies: {
            getAll: () => request.cookies.getAll(),
            setAll: (values, headers) => {
              cookiesToSet.push(...values);
              Object.assign(authHeaders, headers);
            },
          },
        },
      )
    : null;

  if (supabase && (code || (tokenHash && type))) {
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type! });
    if (!error) {
      const response = redirectWithinOrigin(next);
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      Object.entries(authHeaders).forEach(([name, value]) => {
        response.headers.set(name, value);
      });
      return response;
    }
  }

  const retry = new URLSearchParams({ status: "link-expired", next });
  return redirectWithinOrigin(`/auth?${retry.toString()}`);
}
