import "./setup.js";
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { AddressInfo } from "node:net";
import { io as connect, type Socket } from "socket.io-client";
import { buildApp } from "@/app.js";
import { SESSION_COOKIE } from "@/controllers/auth.controller.js";
import { SocketEvent } from "@/sockets/events.js";
import { makeShop, type TestShop } from "./fixtures.js";

type App = Awaited<ReturnType<typeof buildApp>>;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** เชื่อม socket ฝั่งลูกค้าด้วย token ของโต๊ะ แล้วนับสัญญาณ table:changed ที่ได้รับ */
async function customerSocket(url: string, token: string) {
  const socket: Socket = connect(url, { auth: { table: token }, transports: ["websocket"] });
  const counter = { count: 0 };
  socket.on(SocketEvent.TableChanged, () => counter.count++);
  await new Promise<void>((resolve, reject) => {
    socket.on("connect", () => resolve());
    socket.on("connect_error", reject);
  });
  // ให้ server join ห้องเสร็จก่อน (join ทำหลัง connect แบบ async)
  await wait(150);
  return { socket, counter };
}

describe("HTTP + socket ฝั่งลูกค้า", () => {
  let app: App;
  let url: string;
  let a: TestShop;
  let b: TestShop;
  const sockets: Socket[] = [];

  before(async () => {
    app = await buildApp();
    await app.listen({ port: 0, host: "127.0.0.1" });
    url = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
    a = await makeShop("rtA");
    b = await makeShop("rtB");
  });

  after(async () => {
    for (const socket of sockets) socket.disconnect();
    await app.close();
  });

  const order = (s: TestShop, headers: Record<string, string> = {}) =>
    app.inject({
      method: "POST",
      url: `/api/public/t/${s.token}/orders`,
      headers: { "x-table-session": s.ticket, ...headers },
      payload: { items: [{ menuItemId: s.noodle.id, quantity: 1 }] },
    });

  const ownerCookie = (s: TestShop) => `${SESSION_COOKIE}=${app.jwt.sign({ sub: s.user.id })}`;

  it("ลูกค้าสั่งผ่าน HTTP ได้ 201 และส่งซ้ำด้วย Idempotency-Key เดิมได้ 200 ออเดอร์เดิม", async () => {
    const first = await order(a, { "idempotency-key": "http-key-0001" });
    assert.equal(first.statusCode, 201);
    const again = await order(a, { "idempotency-key": "http-key-0001" });
    assert.equal(again.statusCode, 200);
    assert.equal(again.json().id, first.json().id);
    assert.equal(again.json().code, first.json().code);
  });

  it("ไม่แนบตั๋วรอบ = ถูกปฏิเสธ และรายการเกินเพดานถูกปฏิเสธ 400", async () => {
    const noTicket = await app.inject({
      method: "POST",
      url: `/api/public/t/${a.token}/orders`,
      payload: { items: [{ menuItemId: a.noodle.id, quantity: 1 }] },
    });
    assert.equal(noTicket.statusCode, 409);
    const tooMany = await app.inject({
      method: "POST",
      url: `/api/public/t/${a.token}/orders`,
      headers: { "x-table-session": a.ticket },
      payload: { items: Array.from({ length: 31 }, () => ({ menuItemId: a.noodle.id, quantity: 1 })) },
    });
    assert.equal(tooMany.statusCode, 400);
  });

  it("ครัวเปลี่ยนสถานะ → ลูกค้าโต๊ะนั้นได้สัญญาณทันที ส่วนโต๊ะร้านอื่นไม่ได้", async () => {
    const mine = await customerSocket(url, a.token);
    const other = await customerSocket(url, b.token);
    const bogus = await customerSocket(url, "ไม่ใช่โทเคนจริง-ไม่ใช่โทเคนจริง-ไม่ใช่โทเคนจริง");
    sockets.push(mine.socket, other.socket, bogus.socket);

    const placed = (await order(a)).json() as { id: string };
    await wait(300);
    assert.equal(mine.counter.count, 1, "ลูกค้าโต๊ะนี้ต้องรู้ว่ามีออเดอร์ใหม่");
    const before = mine.counter.count;

    const patch = await app.inject({
      method: "PATCH",
      url: `/api/orders/${placed.id}/status`,
      headers: { cookie: ownerCookie(a) },
      payload: { status: "PREPARING" },
    });
    assert.equal(patch.statusCode, 200);
    await wait(500);

    assert.equal(mine.counter.count, before + 1, "ครัวเปลี่ยนสถานะแล้วลูกค้าต้องได้สัญญาณ");
    assert.equal(other.counter.count, 0, "โต๊ะของร้านอื่นต้องไม่ได้รับ");
    assert.equal(bogus.counter.count, 0, "token ปลอมต้องไม่ได้เข้าห้องใด");
  });

  it("พนักงานปิดโต๊ะ → ลูกค้าได้สัญญาณ (หน้าลูกค้าจะรู้ว่ารอบจบ)", async () => {
    const s = await makeShop("rtClose");
    const mine = await customerSocket(url, s.token);
    sockets.push(mine.socket);
    const res = await app.inject({
      method: "POST",
      url: `/api/tables/${s.tableId}/close`,
      headers: { cookie: ownerCookie(s) },
    });
    assert.equal(res.statusCode, 200);
    await wait(400);
    assert.equal(mine.counter.count, 1);
  });
});
