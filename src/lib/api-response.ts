import { NextResponse } from "next/server";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = {
  success: false;
  error: string;
  fields?: Record<string, string>;
};

type ErrorDetails = Omit<ApiFailure, "success" | "error"> & Record<string, unknown>;

/** Consistent JSON success envelope for every application API route. */
export function apiSuccess<T>(data: T, status = 200, headers?: HeadersInit) {
  return NextResponse.json<ApiSuccess<T>>(
    { success: true, data },
    { status, headers },
  );
}

/** Consistent, client-safe JSON error envelope. Never pass raw Error objects. */
export function apiError(
  error: string,
  status: number,
  details: ErrorDetails = {},
) {
  return NextResponse.json(
    { success: false as const, error, ...details },
    { status },
  );
}
