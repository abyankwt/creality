import type { ApiResponse } from "@/lib/types";

export const ERROR_MESSAGES = {
  badRequest: "Invalid request.",
  invalidCredentials: "Invalid email or password.",
  unauthorized: "You are not authenticated.",
  registrationFailed: "Unable to create account.",
  serviceUnavailable: "Service temporarily unavailable. Please try again later.",
  serverError: "Something went wrong. Please try again.",
  notFound: "Resource not found.",
} as const;

export const apiSuccess = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

export const apiError = (message: string): ApiResponse<never> => ({
  success: false,
  error: message,
});

export const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    if (error.message.startsWith("Missing ")) {
      return error.message;
    }
  }
  return fallback;
};

export const normalizeStatusMessage = (status: number, fallback: string) => {
  if (status === 400) return ERROR_MESSAGES.badRequest;
  if (status === 401 || status === 403) return ERROR_MESSAGES.unauthorized;
  if (status === 404) return ERROR_MESSAGES.notFound;
  if (status >= 500) return ERROR_MESSAGES.serviceUnavailable;
  return fallback;
};
