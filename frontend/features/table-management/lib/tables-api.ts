import { clientHttp } from "@/lib/http/client";
import type { CreateSpec, DiningTable, EditValues } from "@/features/table-management/types";

/** โต๊ะจาก backend: session.id เป็นรหัสยาว จึงย่อเป็นรหัสอ่านง่าย (S-XXXX) ไว้แสดงผล */
interface ApiTable extends Omit<DiningTable, "session"> {
  session: { id: string; openedAt: number } | null;
}

const toTable = (table: ApiTable): DiningTable => ({
  ...table,
  session: table.session
    ? { ...table.session, id: `S-${table.session.id.replace(/-/g, "").slice(0, 4).toUpperCase()}` }
    : null,
});

export const tablesApi = {
  list: (signal?: AbortSignal) =>
    clientHttp.get<ApiTable[]>("/tables", { signal }).then((res) => res.data.map(toTable)),
  create: (spec: CreateSpec) =>
    clientHttp.post<ApiTable[]>("/tables", spec).then((res) => res.data.map(toTable)),
  update: (id: string, values: EditValues) =>
    clientHttp.patch<ApiTable>(`/tables/${id}`, values).then((res) => toTable(res.data)),
  remove: (ids: string[]) => clientHttp.post("/tables/delete", { ids }),
  open: (id: string) => clientHttp.post<ApiTable>(`/tables/${id}/open`).then((res) => toTable(res.data)),
  close: (id: string) => clientHttp.post<ApiTable>(`/tables/${id}/close`).then((res) => toTable(res.data)),
};
