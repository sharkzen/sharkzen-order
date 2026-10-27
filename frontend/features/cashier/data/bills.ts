import type { BillLine, BillRound, TableBill } from "../types";

/**
 * ข้อมูลตัวอย่างสำหรับหน้าคิดเงิน (ข้อมูลสมมติ ชื่อโต๊ะตรงกับหน้าโต๊ะและคิวอาร์โค้ด ราคาตรงกับหน้าเมนู)
 * เมื่อมี API ให้แทนที่ด้วยบิลของโต๊ะที่เปิดอยู่จาก services/ โดยคง type TableBill ไว้
 */
export const UPDATED_AT = "14:32 น.";
/** วันที่ที่แสดงบนใบเสร็จ (เมื่อมี API ให้ใช้วันที่จริงของการชำระ) */
export const BILL_DATE = "24 ต.ค. 2569";
/** ยอดที่เก็บไปแล้วก่อนหน้านี้ของวันนี้ (ไม่รวมบิลที่เก็บในหน้านี้) */
export const COLLECTED_BEFORE = 9640;

const line = (name: string, unitPrice: number, quantity = 1): BillLine => ({
  name,
  unitPrice,
  quantity,
});

const round = (
  orderId: string,
  time: string,
  lines: BillLine[],
  served = true,
): BillRound => ({ orderId, time, lines, served });

export const BILLS: TableBill[] = [
  {
    tableId: "demo1",
    tableName: "โต๊ะ 1",
    zone: "ชั้น 1",
    openedAt: "13:44",
    payment: null,
    rounds: [
      round("#01241", "13:46", [
        line("ข้าวกะเพราหมูสับไข่ดาว", 75, 2),
        line("ส้มตำไทย", 65),
        line("ชาไทยเย็น", 35, 2),
      ]),
      round("#01249", "14:08", [line("ข้าวเหนียวมะม่วง", 89)]),
    ],
  },
  {
    tableId: "demo4",
    tableName: "โต๊ะ 4",
    zone: "ชั้น 1",
    openedAt: "14:20",
    payment: null,
    rounds: [
      round("#01251", "14:21", [
        line("ผัดไทยกุ้งสด", 95),
        line("ชาไทยเย็น", 35),
      ]),
    ],
  },
  {
    tableId: "demo5",
    tableName: "โต๊ะ 5",
    zone: "ชั้น 1",
    openedAt: "13:17",
    payment: null,
    rounds: [
      round("#01230", "13:19", [
        line("ต้มยำกุ้งน้ำข้น", 120),
        line("กุ้งอบวุ้นเส้น", 130),
        line("ข้าวสวย", 15, 4),
      ]),
      round("#01238", "13:40", [
        line("แกงเขียวหวานไก่", 85),
        line("ส้มตำไทย", 65, 2),
      ]),
      round(
        "#01258",
        "14:32",
        [
          line("ข้าวกะเพราหมูสับไข่ดาว", 75),
          line("แกงเขียวหวานไก่", 85),
          line("ส้มตำไทย", 65),
        ],
        false,
      ),
    ],
  },
  {
    tableId: "demo9",
    tableName: "โต๊ะ 9",
    zone: "ชั้น 2",
    openedAt: "14:28",
    payment: null,
    rounds: [
      round(
        "#01259",
        "14:29",
        [line("ข้าวผัดไข่", 55, 2), line("ชาไทยเย็น", 35, 2)],
        false,
      ),
    ],
  },
  {
    tableId: "demo12",
    tableName: "โต๊ะ 12",
    zone: "โซนริมระเบียง",
    openedAt: "12:50",
    rounds: [
      round("#01212", "12:52", [
        line("ต้มยำกุ้งน้ำข้น", 120, 2),
        line("ผัดไทยกุ้งสด", 95),
      ]),
    ],
    payment: {
      method: "transfer",
      paidAt: "14:05",
      subtotal: 335,
      discount: 0,
      serviceCharge: 0,
      total: 335,
    },
  },
];
