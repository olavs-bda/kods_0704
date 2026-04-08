// src/components/TaskPage.tsx
// Hydrated React island: Convex provider + task workspace
import ConvexClientProvider from "./ConvexClientProvider";
import TaskWorkspace from "./TaskWorkspace";

export default function TaskPage() {
  return (
    <ConvexClientProvider>
      <TaskWorkspace />
    </ConvexClientProvider>
  );
}
