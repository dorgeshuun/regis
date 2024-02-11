import ReactDOM from "react-dom/client";
import App from "./App";
import Table from "./Table";
import "./styles.css";

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

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <RouterProvider router={router} />
);
