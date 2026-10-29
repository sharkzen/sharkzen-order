import "./setup.js";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ipAllowed } from "@/lib/ip-allowlist.js";
import { STAFF_ROUTE_PERMISSIONS, staffMayCall } from "@/lib/route-permissions.js";
import { ALL_PERMISSIONS } from "@/lib/permissions.js";
import { generateTotpSecret, totpAt, verifyTotp } from "@/lib/totp.js";

describe("TOTP (RFC 6238)", () => {
  // secret ASCII "12345678901234567890" = base32 ด้านล่าง เวลา 59 วินาที ได้ 94287082 (6 หลักท้าย 287082)
  const rfcSecret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

  it("ตรงกับ test vector ของ RFC", () => {
    assert.equal(totpAt(rfcSecret, 59_000), "287082");
    assert.equal(totpAt(rfcSecret, 1_111_111_109_000), "081804");
  });

  it("ยอมคลาดเคลื่อน ±1 ช่วง แต่ไม่เกินนั้น และปฏิเสธรูปแบบผิด", () => {
    const now = 1_700_000_000_000;
    const code = totpAt(rfcSecret, now);
    assert.ok(verifyTotp(rfcSecret, code, now));
    assert.ok(verifyTotp(rfcSecret, code, now + 30_000));
    assert.ok(!verifyTotp(rfcSecret, code, now + 90_000));
    assert.ok(!verifyTotp(rfcSecret, "12345", now));
    assert.ok(!verifyTotp(rfcSecret, "abcdef", now));
  });

  it("secret ที่สร้างใหม่ใช้งานได้และไม่ซ้ำกัน", () => {
    const a = generateTotpSecret();
    assert.notEqual(a, generateTotpSecret());
    assert.ok(verifyTotp(a, totpAt(a, Date.now())));
  });
});

describe("IP allowlist", () => {
  it("รายการว่าง = ไม่จำกัด", () => assert.ok(ipAllowed("1.2.3.4", [])));

  it("ตรงทั้งแบบ IP เดี่ยวและ CIDR (IPv4)", () => {
    const list = ["203.0.113.10", "10.0.0.0/8"];
    assert.ok(ipAllowed("203.0.113.10", list));
    assert.ok(ipAllowed("10.200.3.4", list));
    assert.ok(!ipAllowed("203.0.113.11", list));
    assert.ok(!ipAllowed("11.0.0.1", list));
  });

  it("รองรับ IPv4-mapped IPv6 และ IPv6 CIDR", () => {
    assert.ok(ipAllowed("::ffff:10.1.2.3", ["10.0.0.0/8"]));
    assert.ok(ipAllowed("2001:db8::1", ["2001:db8::/32"]));
    assert.ok(!ipAllowed("2001:db9::1", ["2001:db8::/32"]));
  });

  it("ค่าที่ผิดรูปแบบไม่ถูกอนุญาต", () => {
    assert.ok(!ipAllowed("not-an-ip", ["10.0.0.0/8"]));
    assert.ok(!ipAllowed("10.0.0.1", ["10.0.0.0/99"]));
  });
});

describe("ตารางสิทธิ์ของพนักงาน", () => {
  it("ทุกสิทธิ์ที่อ้างถึงมีอยู่ในแคตตาล็อก (กันพิมพ์ผิดแล้วไม่มีใครใช้ route นั้นได้)", () => {
    const known = new Set(ALL_PERMISSIONS);
    for (const [route, rule] of Object.entries(STAFF_ROUTE_PERMISSIONS)) {
      for (const permission of rule ?? []) assert.ok(known.has(permission), `${route} อ้างถึงสิทธิ์ที่ไม่มี: ${permission}`);
    }
  });

  it("route ที่ไม่รู้จักและเส้นของเจ้าของร้านถูกปฏิเสธ", () => {
    assert.ok(!staffMayCall("GET", "/api/billing", ALL_PERMISSIONS));
    assert.ok(!staffMayCall("POST", "/api/shop/branches", ALL_PERMISSIONS));
    assert.ok(!staffMayCall("GET", "/api/admin/overview", ALL_PERMISSIONS));
    assert.ok(staffMayCall("GET", "/api/auth/me", []));
  });
});
