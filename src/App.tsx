import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Index from "./pages/Index";
import BlogList from "./pages/BlogList";
import BlogArticle from "./pages/BlogArticle";
import NotFound from "./pages/NotFound";
import ScarAssessment from "./pages/ScarAssessment";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import PromotionsList from "./pages/admin/PromotionsList";
import PromotionEditor from "./pages/admin/PromotionEditor";
import BlogsList from "./pages/admin/BlogsList";
import BlogEditor from "./pages/admin/BlogEditor";
import ContentCanvas from "./pages/admin/ContentCanvas";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/scar-assessment" element={<ScarAssessment />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogArticle />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route element={<AdminLayout />}>
              <Route path="/admin/promotions" element={<PromotionsList />} />
              <Route path="/admin/promotions/new" element={<PromotionEditor />} />
              <Route path="/admin/promotions/:id" element={<PromotionEditor />} />
              <Route path="/admin/blogs" element={<BlogsList />} />
              <Route path="/admin/blogs/new" element={<BlogEditor />} />
              <Route path="/admin/blogs/:id" element={<BlogEditor />} />
              <Route path="/admin/content-canvas" element={<ContentCanvas />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
