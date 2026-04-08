// src/components/SessionError.tsx
// Error state with return-to-login action
import { clearSession } from "../lib/sessionStore";

export default function SessionError({ message }: { message: string }) {
  function handleReturn() {
    clearSession();
    window.location.href = "/";
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="rounded-2xl bg-error-container px-6 py-4 text-center">
        <p className="text-sm font-medium text-on-error-container">{message}</p>
      </div>
      <button
        onClick={handleReturn}
        className="text-sm text-primary hover:underline"
      >
        Atgriezties uz sākumlapu
      </button>
    </div>
  );
}
