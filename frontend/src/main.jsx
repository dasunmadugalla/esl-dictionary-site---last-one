import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { IPProvider } from "./context/IPContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import Loader from "./components/Loader.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // cache stays fresh for 5 minutes
      retry: 1,
    },
  },
});

// eagerly load the most common pages
import Home from "./pages/Home.jsx";
import Search_result from "./pages/Search_result.jsx";

// lazy load everything else
const Notfound     = lazy(() => import("./pages/Notfound.jsx"));
const Auth         = lazy(() => import("./pages/Auth.jsx"));
const Settings     = lazy(() => import("./pages/Settings.jsx"));
const VerifyOTP    = lazy(() => import("./pages/VerifyOTP.jsx"));
const Policy       = lazy(() => import("./pages/Policy.jsx"));
const Bookmarks    = lazy(() => import("./pages/Bookmarks.jsx"));
const Trending     = lazy(() => import("./pages/Trending.jsx"));
const WordOTD      = lazy(() => import("./pages/WordOTD.jsx"));
const Dashboard    = lazy(() => import("./pages/Dashboard.jsx"));
const Collections   = lazy(() => import("./pages/Collections.jsx"));
const CollectionPage = lazy(() => import("./pages/CollectionPage.jsx"));
const SearchHistory  = lazy(() => import("./pages/SearchHistory.jsx"));
const AdminFeedback  = lazy(() => import("./pages/AdminFeedback.jsx"));
const Feedback       = lazy(() => import("./pages/Feedback.jsx"));
const About          = lazy(() => import("./pages/About.jsx"));
const Contact        = lazy(() => import("./pages/Contact.jsx"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "word/:search", element: <Search_result /> },
      { path: "/bookmarks", element: <ProtectedRoute><Suspense fallback={<Loader />}><Bookmarks /></Suspense></ProtectedRoute> },
      { path: "/trending", element: <Suspense fallback={<Loader />}><Trending /></Suspense> },
      { path: "/word-of-the-day", element: <Suspense fallback={<Loader />}><WordOTD /></Suspense> },
      { path: "/dashboard", element: <ProtectedRoute><Suspense fallback={<Loader />}><Dashboard /></Suspense></ProtectedRoute> },
      { path: "/collections", element: <ProtectedRoute><Suspense fallback={<Loader />}><Collections /></Suspense></ProtectedRoute> },
      { path: "/collections/:id", element: <ProtectedRoute><Suspense fallback={<Loader />}><CollectionPage /></Suspense></ProtectedRoute> },
      { path: "/settings", element: <ProtectedRoute><Suspense fallback={<Loader />}><Settings /></Suspense></ProtectedRoute> },
      { path: "/history", element: <ProtectedRoute><Suspense fallback={<Loader />}><SearchHistory /></Suspense></ProtectedRoute> },
      { path: "/admin/feedback",  element: <ProtectedRoute><Suspense fallback={<Loader />}><AdminFeedback /></Suspense></ProtectedRoute> },
      { path: "/feedback",        element: <ProtectedRoute><Suspense fallback={<Loader />}><Feedback /></Suspense></ProtectedRoute> },
      { path: "/about",           element: <Suspense fallback={<Loader />}><About /></Suspense> },
      { path: "/contact",         element: <Suspense fallback={<Loader />}><Contact /></Suspense> },
    ],
  },
  { path: "/auth", element: <Suspense fallback={<Loader />}><Auth /></Suspense> },
  { path: "/signup", element: <Navigate to="/auth" replace /> },
  { path: "/verify-otp", element: <Suspense fallback={<Loader />}><VerifyOTP /></Suspense> },
  { path: "policy", element: <Suspense fallback={<Loader />}><Policy /></Suspense> },
  { path: "*", element: <Suspense fallback={<Loader />}><Notfound /></Suspense> },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <IPProvider>
              <RouterProvider router={router} />
            </IPProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
