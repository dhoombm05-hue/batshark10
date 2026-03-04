import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import Forecasts from "./pages/Forecasts";
import StrategicAnalysis from "./pages/StrategicAnalysis";
import BatSharkAI from "./pages/BatSharkAI";
import FinancialLab from "./pages/FinancialLab";
import UserManagement from "./pages/UserManagement";
import SetupCEO from "./pages/SetupCEO";
import DocumentCenter from "./pages/DocumentCenter";
import CustomTables from "./pages/CustomTables";
import ChatRooms from "./pages/ChatRooms";
import News from "./pages/News";
import NotFound from "./pages/NotFound";
import BatSharkRobot from "./components/BatSharkRobot";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<SetupCEO />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
            <Route path="/employees/:id" element={<ProtectedRoute><EmployeeDetail /></ProtectedRoute>} />
            <Route path="/forecasts" element={<ProtectedRoute><Forecasts /></ProtectedRoute>} />
            <Route path="/strategic" element={<ProtectedRoute><StrategicAnalysis /></ProtectedRoute>} />
            <Route path="/ai" element={<ProtectedRoute><BatSharkAI /></ProtectedRoute>} />
            <Route path="/lab" element={<ProtectedRoute><FinancialLab /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><DocumentCenter /></ProtectedRoute>} />
            <Route path="/tables" element={<ProtectedRoute><CustomTables /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatRooms /></ProtectedRoute>} />
            <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BatSharkRobot />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
