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
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import OperationalDashboard from "./pages/OperationalDashboard";
import ProjectsDashboard from "./pages/ProjectsDashboard";
import SmartAlerts from "./pages/SmartAlerts";
import Reports from "./pages/Reports";
import AIInsights from "./pages/AIInsights";
import DataDictionary from "./pages/DataDictionary";
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
import PrivateMessages from "./pages/PrivateMessages";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Tasks from "./pages/Tasks";
import ImportCenter from "./pages/ImportCenter";
import TaskDistribution from "./pages/TaskDistribution";
import TaskDistributionDetail from "./pages/TaskDistributionDetail";
import BusinessFeasibility from "./pages/BusinessFeasibility";
import Quizzes from "./pages/Quizzes";
import Invoices from "./pages/Invoices";
import Batshare99 from "./pages/Batshare99";
import BuildBusiness from "./pages/BuildBusiness";
import B99Showcase from "./pages/B99Showcase";
import B99Layout from "./pages/b99/B99Layout";
import B99Home from "./pages/b99/B99Home";
import B99Generator from "./pages/b99/B99Generator";
import B99Ads from "./pages/b99/B99Ads";
import B99Platforms from "./pages/b99/B99Platforms";
import B99Search from "./pages/b99/B99Search";
import B99Dashboard from "./pages/b99/B99Dashboard";
import B99Level1 from "./pages/b99/B99Level1";
import B99Level2 from "./pages/b99/B99Level2";
import B99Level3 from "./pages/b99/B99Level3";
import B99Linked from "./pages/b99/B99Linked";
import B99Inspiration from "./pages/b99/B99Inspiration";
import PlatformView from "./pages/PlatformView";
import PlatformEditor from "./pages/PlatformEditor";
import NotFound from "./pages/NotFound";
import BatSharkRobot from "./components/BatSharkRobot";
import BatSharkGuide from "./components/BatSharkGuide";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<B99Showcase />} />
            <Route path="/login" element={<Login />} />
            <Route path="/build" element={<BuildBusiness />} />
            <Route path="/p/:slug" element={<PlatformView />} />
            <Route path="/p/:slug/edit" element={<PlatformEditor />} />
            <Route path="/b99" element={<B99Layout />}>
              <Route index element={<B99Home />} />
              <Route path="generator" element={<B99Generator />} />
              <Route path="generator/:level" element={<B99Generator />} />
              <Route path="level/1" element={<B99Level1 />} />
              <Route path="level/2" element={<B99Level2 />} />
              <Route path="level/3" element={<B99Level3 />} />
              <Route path="ads" element={<B99Ads />} />
              <Route path="platforms" element={<B99Platforms />} />
              <Route path="search" element={<B99Search />} />
              <Route path="dashboard" element={<B99Dashboard />} />
            </Route>
            <Route path="/setup" element={<SetupCEO />} />
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
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
            <Route path="/messages" element={<ProtectedRoute><PrivateMessages /></ProtectedRoute>} />
            <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
            <Route path="/news/:id" element={<ProtectedRoute><NewsDetail /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/import" element={<ProtectedRoute><ImportCenter /></ProtectedRoute>} />
            <Route path="/task-distribution" element={<ProtectedRoute><TaskDistribution /></ProtectedRoute>} />
            <Route path="/task-distribution/:id" element={<ProtectedRoute><TaskDistributionDetail /></ProtectedRoute>} />
            <Route path="/business-feasibility" element={<ProtectedRoute><BusinessFeasibility /></ProtectedRoute>} />
            <Route path="/quizzes" element={<ProtectedRoute><Quizzes /></ProtectedRoute>} />
            <Route path="/executive" element={<ProtectedRoute><ExecutiveDashboard /></ProtectedRoute>} />
            <Route path="/operational" element={<ProtectedRoute><OperationalDashboard /></ProtectedRoute>} />
            <Route path="/projects-dashboard" element={<ProtectedRoute><ProjectsDashboard /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><SmartAlerts /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/ai-insights" element={<ProtectedRoute><AIInsights /></ProtectedRoute>} />
            <Route path="/dictionary" element={<ProtectedRoute><DataDictionary /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/batshare99" element={<ProtectedRoute><Batshare99 /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BatSharkRobot />
          <BatSharkGuide />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
