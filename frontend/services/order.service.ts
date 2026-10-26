import { serverHttp } from "@/lib/http/server";
import type { ApiResponse, Paginated } from "@/types/api";
import type { Order } from "@/types/order";

/** Service ฝั่ง server — เรียกจาก Server Component ได้โดยตรง */
export const orderService = {
  async list(page = 1): Promise<Paginated<Order>> {
    const { data } = await serverHttp.get<ApiResponse<Paginated<Order>>>(
      "/orders",
      {
        params: { page },
      },
    );
    return data.data;
  },

  async get(id: string): Promise<Order> {
    const { data } = await serverHttp.get<ApiResponse<Order>>(`/orders/${id}`);
    return data.data;
  },
};
