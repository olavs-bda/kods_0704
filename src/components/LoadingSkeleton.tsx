// src/components/LoadingSkeleton.tsx
// Placeholder skeleton shown while task data is loading
export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex gap-3">
        <div className="h-7 w-16 rounded-full bg-surface-container-high" />
        <div className="h-7 w-24 rounded-full bg-surface-container-high" />
      </div>
      <div className="space-y-3 rounded-2xl bg-surface-container-lowest p-6">
        <div className="h-6 w-3/4 rounded-lg bg-surface-container-high" />
        <div className="h-4 w-full rounded-lg bg-surface-container-high" />
        <div className="h-4 w-5/6 rounded-lg bg-surface-container-high" />
      </div>
      <div className="h-32 rounded-2xl bg-surface-container-high" />
    </div>
  );
}
