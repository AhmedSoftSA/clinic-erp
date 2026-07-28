import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { trpc, trpcClient } from "@/lib/trpc";
import { AuthProvider } from "@/contexts/AuthContext";
import { UiProvider, useUi } from "@/contexts/UiContext";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

function Root() {
  const { dir } = useUi();

  return (
    <AuthProvider>
      <App />
      <Toaster position="top-center" richColors dir={dir} />
    </AuthProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <UiProvider>
          <Root />
        </UiProvider>
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>
);
