import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ScanPage from "@/pages/session/Scan";
import IdentifyPage from "@/pages/session/Identify";
import GroundHealPage from "@/pages/session/GroundHeal";
import TrackPage from "@/pages/session/Track";
import SessionSummaryPage from "@/pages/session/SessionSummary";
import HistoryPage from "./pages/History.tsx";
import SettingsPage from "./pages/Settings.tsx";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: "/", element: <Index /> },
  { path: "/session/scan", element: <ScanPage /> },
  { path: "/session/identify", element: <IdentifyPage /> },
  { path: "/session/ground-heal", element: <GroundHealPage /> },
  { path: "/session/track", element: <TrackPage /> },
  { path: "/session/summary/:sessionId", element: <SessionSummaryPage /> },
  { path: "/history", element: <HistoryPage /> },
  { path: "/settings", element: <SettingsPage /> },
  { path: "*", element: <NotFound /> },
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RouterProvider router={router} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
