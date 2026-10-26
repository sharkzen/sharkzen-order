import { Spinner } from "@/components/ui";

export default function Loading() {
  return (
    <div className="text-primary flex flex-1 items-center justify-center py-24">
      <Spinner className="size-8" />
    </div>
  );
}
