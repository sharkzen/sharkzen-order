export interface PasswordStrength {
  /** 0 = ยังไม่กรอก, 1-4 = อ่อน → แข็งแรง */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

const LABELS = ["", "อ่อน", "พอใช้", "ดี", "แข็งแรง"] as const;

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: LABELS[0] };

  const checks = [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  // รหัสผ่านสั้นกว่า 8 ตัวอักษรถือว่าอ่อนเสมอ ไม่ว่าจะมีอักขระหลากหลายแค่ไหน
  const score = checks[0]
    ? (Math.max(1, checks.filter(Boolean).length) as 1 | 2 | 3 | 4)
    : 1;
  return { score, label: LABELS[score] };
}
