// src/components/LoginPage.tsx
// Hydrated React island: Convex provider + login form + blurred task preview
import { useState } from "react";
import ConvexClientProvider from "./ConvexClientProvider";
import LoginForm from "./LoginForm";
import TaskPreview from "./TaskPreview";

export default function LoginPage() {
  const [submitting, setSubmitting] = useState(false);

  return (
    <ConvexClientProvider>
      {/* Form in normal flow — sets the container height */}
      <div className="relative overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        {/* Task preview fills the same space behind the form */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-xl bg-white p-6">
          <TaskPreview ready={submitting} />
        </div>

        {/* Form on top — fades out when submitting */}
        <div
          className={`relative z-10 rounded-xl bg-white p-6 transition-opacity duration-500 ${
            submitting ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <LoginForm onLoading={setSubmitting} />
        </div>
      </div>
    </ConvexClientProvider>
  );
}
