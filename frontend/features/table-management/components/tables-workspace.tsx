"use client";

import { useMemo } from "react";
import { Button, Card, Skeleton } from "@/components/ui";
import { useResource } from "@/hooks/use-resource";
import { SocketEvent } from "@/lib/socket";
import { notify } from "@/lib/toast";
import { tablesApi } from "@/features/table-management/lib/tables-api";
import type { DiningTable } from "@/features/table-management/types";
import { TablesView, type TableActions } from "./tables-view";

const PLACEHOLDER: DiningTable[] = Array.from({ length: 8 }, (_, index) => ({
  id: `p${index}`,
  token: `p${index}`,
  name: "โต๊ะ 0",
  zone: "โซนตัวอย่าง",
  seats: 4,
  session: index % 3 === 0 ? { id: "S-0000", openedAt: Date.now() } : null,
}));

const NOOP_ACTIONS: TableActions = {
  open: async () => undefined,
  close: async () => undefined,
  create: async () => undefined,
  update: async () => false,
  remove: async () => false,
};

/** หน้าโต๊ะและคิวอาร์โค้ด: โหลดจาก API และอัปเดตสดเมื่อโต๊ะเปิด-ปิดหรือบิลเปลี่ยน */
export function TablesWorkspace() {
  const { data, setData, error, reload } = useResource(tablesApi.list, {
    refetchOn: [SocketEvent.TablesChanged],
  });

  const actions = useMemo<TableActions>(() => {
    const replace = (next: DiningTable) =>
      setData((current) => current?.map((table) => (table.id === next.id ? next : table)));

    return {
      async open(table) {
        try {
          const next = await tablesApi.open(table.id);
          replace(next);
          notify.success(
            `เปิด ${table.name} แล้ว`,
            `รหัสรอบ ${next.session?.id} • ลูกค้าสแกน QR สั่งอาหารได้ทันที`,
          );
        } catch (e) {
          notify.error(e);
        }
      },

      async close(table) {
        try {
          replace(await tablesApi.close(table.id));
          notify.success(`ปิด ${table.name} แล้ว`, "ลูกค้าคนถัดไปจะได้รหัสรอบใหม่");
        } catch (e) {
          notify.error(e);
        }
      },

      async create(spec) {
        try {
          const created = await tablesApi.create(spec);
          setData((current) => (current ? [...current, ...created] : created));
          notify.success(
            created.length === 1 ? `เพิ่ม ${created[0].name} แล้ว` : `เพิ่ม ${created.length} โต๊ะแล้ว`,
            "เลือกไว้ให้แล้ว กดพิมพ์ QR ไปติดโต๊ะได้เลย",
          );
          return created;
        } catch (e) {
          notify.error(e);
          return undefined;
        }
      },

      async update(id, values) {
        try {
          replace(await tablesApi.update(id, values));
          notify.success(`บันทึก ${values.name} แล้ว`);
          return true;
        } catch (e) {
          notify.error(e);
          return false;
        }
      },

      async remove(table) {
        try {
          await tablesApi.remove([table.id]);
          setData((current) => current?.filter((existing) => existing.id !== table.id));
          notify.success(`ลบ ${table.name} แล้ว`);
          return true;
        } catch (e) {
          notify.error(e);
          return false;
        }
      },
    };
  }, [setData]);

  if (!data) {
    if (error) {
      return (
        <Card role="alert" className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-danger text-sm">โหลดข้อมูลโต๊ะไม่สำเร็จ: {error}</p>
          <Button variant="outline" onClick={reload}>
            ลองใหม่
          </Button>
        </Card>
      );
    }
    return (
      <Skeleton>
        <TablesView tables={PLACEHOLDER} actions={NOOP_ACTIONS} />
      </Skeleton>
    );
  }

  return <TablesView tables={data} actions={actions} />;
}
