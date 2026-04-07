// src/components/ConvexClientProvider.tsx
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import type { ReactNode } from "react";

const convexUrl = import.meta.env.PUBLIC_CONVEX_URL;

const convex = new ConvexReactClient(convexUrl);

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
