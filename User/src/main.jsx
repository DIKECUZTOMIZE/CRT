import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";

import AppRoutes from "./app/routes/AppRoutes.jsx";
import AuthBootstrap from "./app/store/AuthBootstrap.jsx";
import { store } from "./app/store/store.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: false,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>
        <AppRoutes />
      </AuthBootstrap>
    </QueryClientProvider>
  </Provider>
);
