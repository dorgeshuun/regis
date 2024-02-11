import ReactDOM from "react-dom/client";
import App from "./App";
import Table from "./Table";
import "./styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
    },
    {
        path: "/table/:uuid",
        element: <Table />,
    },
]);

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
    </QueryClientProvider>
);
