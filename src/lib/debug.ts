// debug.ts
export const IS_DEBUG_MODE = true; // Set to false for production

export function logDebug(message: string, ...args: any[]) {
  if (IS_DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}