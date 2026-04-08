// src/components/AdminDashboard.tsx
// Facilitator dashboard with password gate + live stats via Convex queries
import { useState } from "react";
import ConvexClientProvider from "./ConvexClientProvider";
import AdminDashboardInner from "./AdminDashboardInner";

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [submittedPassword, setSubmittedPassword] = useState<string | null>(
    null,
  );

  if (!submittedPassword) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password.trim()) setSubmittedPassword(password.trim());
          }}
          className="bg-surface-container rounded-2xl p-8 shadow-lg w-full max-w-sm space-y-4"
        >
          <h1 className="text-xl font-bold text-on-surface font-headline">
            Administratora panelis
          </h1>
          <p className="text-sm text-on-surface-variant">
            Ievadiet administratora paroli, lai turpinātu.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parole"
            className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            autoFocus
          />
          <button
            type="submit"
            disabled={!password.trim()}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          >
            Ieiet
          </button>
        </form>
      </div>
    );
  }

  return (
    <ConvexClientProvider>
      <AdminDashboardInner
        password={submittedPassword}
        onLogout={() => setSubmittedPassword(null)}
      />
    </ConvexClientProvider>
  );
}
