"use client";

import { useSyncExternalStore } from "react";

const formatter = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

const subscribe = () => () => {};

/** วันที่ปัจจุบัน (พ.ศ.) คำนวณฝั่งผู้ใช้เพื่อไม่ให้ค้างตามวันที่ build (ฝั่ง server แสดงว่างไว้ก่อน) */
export function TodayLabel() {
  const label = useSyncExternalStore(
    subscribe,
    () => formatter.format(new Date()),
    () => "",
  );

  return <span>{label}</span>;
}
