import type { Mail } from "../lib/mailer.js";

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function layout(title: string, body: string) {
  return `<!doctype html><html lang="th"><body style="margin:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:16px;padding:32px">
<tr><td style="font-size:18px;font-weight:700;color:#2563eb;padding-bottom:20px">SHARKZEN ORDER</td></tr>
<tr><td style="font-size:20px;font-weight:700;padding-bottom:12px">${title}</td></tr>
<tr><td style="font-size:15px;line-height:1.6;color:#334155">${body}</td></tr>
</table></td></tr></table></body></html>`;
}

export function otpEmail(to: string, firstName: string, code: string, minutes: number): Mail {
  const name = escape(firstName);
  return {
    to,
    subject: `รหัสยืนยันอีเมล ${code} — SHARKZEN ORDER`,
    text: `สวัสดีคุณ ${firstName}\nรหัสยืนยันอีเมลของคุณคือ ${code} (หมดอายุใน ${minutes} นาที)\nหากคุณไม่ได้สมัคร โปรดละเลยอีเมลนี้`,
    html: layout(
      "ยืนยันอีเมลของคุณ",
      `สวัสดีคุณ ${name}<br/>กรอกรหัสนี้ในหน้าสมัครสมาชิกเพื่อยืนยันตัวตน
<div style="margin:20px 0;padding:16px;text-align:center;background:#eff6ff;border-radius:12px;font-size:32px;font-weight:700;letter-spacing:10px;color:#1d4ed8">${code}</div>
รหัสหมดอายุใน ${minutes} นาที อย่าบอกรหัสนี้กับผู้อื่น<br/>หากคุณไม่ได้สมัคร โปรดละเลยอีเมลนี้`,
    ),
  };
}

export function resetPasswordEmail(to: string, firstName: string, link: string, minutes: number): Mail {
  const name = escape(firstName);
  return {
    to,
    subject: "ตั้งรหัสผ่านใหม่ — SHARKZEN ORDER",
    text: `สวัสดีคุณ ${firstName}\nตั้งรหัสผ่านใหม่ได้ที่ลิงก์นี้ (หมดอายุใน ${minutes} นาที)\n${link}\nหากคุณไม่ได้ขอ โปรดละเลยอีเมลนี้ รหัสผ่านเดิมจะยังใช้ได้`,
    html: layout(
      "ตั้งรหัสผ่านใหม่",
      `สวัสดีคุณ ${name}<br/>เราได้รับคำขอตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ
<div style="margin:24px 0"><a href="${link}" style="background:#2563eb;color:#fff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:700;display:inline-block">ตั้งรหัสผ่านใหม่</a></div>
ลิงก์หมดอายุใน ${minutes} นาที และใช้ได้ครั้งเดียว<br/>หากคุณไม่ได้ขอ โปรดละเลยอีเมลนี้ รหัสผ่านเดิมจะยังใช้ได้`,
    ),
  };
}
