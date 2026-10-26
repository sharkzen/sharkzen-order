import type { Metric } from "../../types";
import { MetricCard } from "./metric-card";

export function MetricsGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <section
      aria-label="ตัวชี้วัดวันนี้"
      className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
    >
      {metrics.map((metric) => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </section>
  );
}
