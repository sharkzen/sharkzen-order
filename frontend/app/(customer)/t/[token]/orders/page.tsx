import { OrdersPage } from "@/features/customer-order/components/orders-page";

export default async function CustomerOrdersPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <OrdersPage token={token} />;
}
