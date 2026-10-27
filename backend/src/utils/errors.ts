export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    /** รหัสให้ frontend ตัดสินใจต่อได้ เช่น EMAIL_NOT_VERIFIED */
    public readonly code?: string,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new AppError(404, `${what} not found`);
