import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { Spinner } from "@/components/ui";
import { OrderDetail } from "@/features/orders/components/order-detail";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Container className="flex flex-col gap-4">
      <Suspense fallback={<Spinner className="text-primary size-6" />}>
        <OrderDetail params={params} />
      </Suspense>
    </Container>
  );
}
