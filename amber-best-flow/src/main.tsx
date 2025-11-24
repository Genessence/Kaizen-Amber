import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";

// Create React Query client with aggressive caching for maximum performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Use cache unless stale - significantly improves navigation speed
      refetchOnReconnect: false, // Don't refetch when internet reconnects
      staleTime: 10 * 60 * 1000, // 10 minutes - data considered fresh for longer
      gcTime: 30 * 60 * 1000, // 30 minutes garbage collection - keep cache longer
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
