import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { PageLoader } from "@/components/ui";
import { OrderDetail } from "@/features/orders/components/order-detail";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Container className="flex flex-col gap-4">
      <Suspense fallback={<PageLoader />}>
        <OrderDetail params={params} />
      </Suspense>
    </Container>
  );
}
