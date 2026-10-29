export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    /** รหัสให้ frontend ตัดสินใจต่อได้ เช่น EMAIL_NOT_VERIFIED */
    public readonly code?: string,
    /** ข้อมูลเสริมที่ส่งถึง client ในตัว error เช่น เหตุผลที่ถูกแบน */
    public readonly extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new AppError(404, `${what} not found`);

/** บัญชีถูกแบน: frontend เห็นรหัสนี้แล้วขึ้นหน้าต่างให้ติดต่อผู้ดูแลระบบ */
export const bannedError = (reason = "") =>
  new AppError(403, "บัญชีนี้ถูกระงับการใช้งาน", "ACCOUNT_BANNED", { reason });

/** ร้านถูกระงับ/เจ้าของถูกแบน: ใช้ทั้งเจ้าของ พนักงาน และลูกค้าหน้าโต๊ะ */
export const shopSuspendedError = (reason = "") =>
  new AppError(403, "ร้านนี้ถูกระงับการใช้งาน", "SHOP_SUSPENDED", { reason });
