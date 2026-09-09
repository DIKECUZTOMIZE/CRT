import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App.jsx";
import { OrganizerAppProvider } from "./app/context/OrganizerAppContext.jsx";
import AuthBootstrap from "./app/store/AuthBootstrap.jsx";
import { store } from "./app/store/store.js";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap>
          <OrganizerAppProvider>
            <App />
          </OrganizerAppProvider>
        </AuthBootstrap>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
