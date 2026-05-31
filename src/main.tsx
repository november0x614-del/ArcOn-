import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import { AppProvider } from "./contexts/AppContext";
import { supabase } from "./lib/supabaseClient";
import "./index.css";

// Removed global fetch monkey-patch because window.fetch is read-only in this environment.
// Standard Lounge practice: Use apiFetch from src/lib/api.ts for authenticated backend calls.

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <App />
      </AppProvider>
    </QueryClientProvider>
  </StrictMode>,
);
