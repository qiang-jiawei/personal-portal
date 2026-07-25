import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { NextResponse } from 'next/server';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 统一的 API 错误处理
 */
export function handleApiError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("API Error:", message);
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

/**
 * 统一的 API 响应格式
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 成功响应
 */
export function successResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({ success: true, data, message });
}

/**
 * 错误响应
 */
export function errorResponse(error: string, status: number = 400): NextResponse {
  return NextResponse.json({ success: false, error }, { status });
}
