import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "unprocessable"
  | "rate_limited"
  | "dependency_unavailable"
  | "internal_error";

export type ApiErrorBody = {
  code: ApiErrorCode;
  error: string;
};

export function apiError(
  code: ApiErrorCode,
  error: string,
  status: number,
  headers?: HeadersInit,
) {
  return NextResponse.json<ApiErrorBody>(
    { code, error },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        ...Object.fromEntries(new Headers(headers).entries()),
      },
    },
  );
}
