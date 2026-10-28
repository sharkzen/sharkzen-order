import { CustomerOrder } from "@/features/customer-order/components/customer-order";

export default async function CustomerOrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <CustomerOrder token={token} />;
}
