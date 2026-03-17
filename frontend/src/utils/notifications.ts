/**
 * Notification System
 * 
 * Centralized notification handling for Google OAuth
 * Uses Sonner toast notifications for clean, modern feedback
 */

import { toast } from "sonner";

/**
 * Show error notification
 * 
 * Used for displaying user-facing error messages
 * Example: "You should sign in first as new user"
 * 
 * @param message - Error message to display
 * @param duration - How long to show (ms), default 5000
 */
export function showErrorNotification(
  message: string,
  duration: number = 5000
): void {
  toast.error(message, {
    duration,
    position: "top-center",
    richColors: true,
  });
}

/**
 * Show success notification
 * 
 * @param message - Success message to display
 * @param duration - How long to show (ms), default 3000
 */
export function showSuccessNotification(
  message: string,
  duration: number = 3000
): void {
  toast.success(message, {
    duration,
    position: "top-center",
    richColors: true,
  });
}

/**
 * Show loading/processing notification
 * 
 * Use this while authentication is in progress
 * 
 * @param message - Message to display
 * @returns Toast ID for later updates
 */
export function showLoadingNotification(message: string): string | number {
  return toast.loading(message, {
    position: "top-center",
  });
}

/**
 * Update or dismiss a loading notification
 * 
 * @param toastId - ID from showLoadingNotification
 * @param message - New message (optional)
 */
export function dismissNotification(toastId: string | number): void {
  toast.dismiss(toastId);
}

/**
 * Specific error for when user not found in database
 */
export function showUserNotFoundError(): void {
  showErrorNotification(
    "You should sign in first as new user. Please use the regular registration method."
  );
}

/**
 * Specific error for Google OAuth failure
 */
export function showGoogleAuthError(reason?: string): void {
  const message =
    reason ||
    "Google login failed. Please try again or use the regular login method.";
  showErrorNotification(message);
}

/**
 * Success message for Google login
 */
export function showGoogleAuthSuccess(userName?: string): void {
  const message = userName
    ? `Welcome back, ${userName}!`
    : "Successfully logged in!";
  showSuccessNotification(message);
}
