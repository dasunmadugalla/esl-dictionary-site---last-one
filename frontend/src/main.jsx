import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import Home from "./pages/Home.jsx";
import Notfound from "./pages/Notfound.jsx";
import Search_result from "./pages/Search_result.jsx";
import Auth from "./pages/Auth.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import Policy from "./pages/Policy.jsx";
import Bookmarks from "./pages/Bookmarks.jsx";
import Trending from "./pages/Trending.jsx";
import WordOTD from "./pages/WordOTD.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { IPProvider } from "./context/IPContext.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "word/:search", element: <Search_result /> },
      { path: "/bookmarks", element: <Bookmarks /> },
      { path: "/trending", element: <Trending /> },
      {
        path: "/word-of-the-day",
        element: <WordOTD />,
      },
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
    ],
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "policy",
    element: <Policy />,
  },
  {
    path: "*",
    element: <Notfound />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <IPProvider>
        <RouterProvider router={router} />
      </IPProvider>
    </AuthProvider>
  </StrictMode>,
);
