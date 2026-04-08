// src/components/LoginPage.tsx
// Hydrated React island: Convex provider + login form + blurred task preview
import { useState } from "react";
import ConvexClientProvider from "./ConvexClientProvider";
import LoginForm from "./LoginForm";
import TaskPreview from "./TaskPreview";
import HelpOverlay from "./HelpOverlay";

export default function LoginPage() {
  const [submitting, setSubmitting] = useState(false);

  return (
    <ConvexClientProvider>
      {/* 8.9 — First-visit onboarding banner */}
      <div className="mb-4">
        <HelpOverlay />
      </div>

      {/* Card using tonal layering — no border, surface lift */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_12px_32px_rgba(43,52,55,0.06)]">
        {/* Task preview fills the same space behind the form */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl bg-surface-container-lowest p-6">
          <TaskPreview ready={submitting} />
        </div>

        {/* Form on top — fades out when submitting */}
        <div
          className={`relative z-10 rounded-2xl bg-surface-container-lowest p-6 transition-opacity duration-500 ${
            submitting ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <LoginForm onLoading={setSubmitting} />
        </div>
      </div>
    </ConvexClientProvider>
  );
}
