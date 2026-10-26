import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { ApiError } from "@/lib/http/api-error";
import { orderService } from "@/services/order.service";
import type { Order } from "@/types/order";

async function getOrder(id: string): Promise<Order> {
  try {
    return await orderService.get(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function OrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);

  return (
    <>
      <h1 className="text-2xl font-bold">คำสั่งซื้อ #{order.id}</h1>
      <Card className="flex flex-col gap-2">
        <p>ลูกค้า: {order.customerName}</p>
        <p>ยอดรวม: {order.total.toLocaleString("th-TH")} บาท</p>
        <Badge className="self-start">{order.status}</Badge>
      </Card>
    </>
  );
}
