"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

// React Query só no navegador: um cliente por aba (usado pela atualização automática do /admin).
export function Providers({ children }: { children: ReactNode }) {
  const [cliente] = useState(() => new QueryClient());
  return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
}
