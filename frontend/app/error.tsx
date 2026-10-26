"use client";

import { Button } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
      <h1 className="text-3xl font-bold">เกิดข้อผิดพลาด</h1>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>ลองใหม่</Button>
    </main>
  );
}
