export class Logger {
  static error(
    message: string,
    error: unknown,
    context?: Record<string, unknown>
  ) {
    console.error(`[ERROR] ${message}`, {
      error,
      context,
      timestamp: new Date().toISOString(),
    });

    if (import.meta.env.PROD) {
      // trackError(message, error, context);
    }
  }

  static warn(message: string, context?: Record<string, unknown>) {
    console.warn(`[WARN] ${message}`, context);
  }

  static info(message: string, context?: Record<string, unknown>) {
    console.info(`[INFO] ${message}`, context);
  }
}
