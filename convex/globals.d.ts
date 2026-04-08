// convex/globals.d.ts
// Convex runtime provides console but TypeScript needs the type declaration
declare const console: {
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  info(...args: unknown[]): void;
};

// Convex runtime exposes environment variables via process.env
declare const process: {
  env: Record<string, string | undefined>;
};
