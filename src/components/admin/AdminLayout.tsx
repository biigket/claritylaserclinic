import { useEffect } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, FileText, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/logo-clarity.jpeg";

const AdminLayout = () => {
  const { user, role, loading, isAdmin, isEditor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user || (!isAdmin && !isEditor)) {
      navigate("/admin/login", { replace: true });
    }
  }, [user, loading, isAdmin, isEditor, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || (!isAdmin && !isEditor)) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const navItems = [
    { href: "/admin/promotions", label: "โปรโมชั่น", sublabel: "Promotions", icon: LayoutDashboard },
    { href: "/admin/blogs", label: "บทความ", sublabel: "Blog Articles", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-60 bg-card border-r border-border flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 border-b border-border">
          <Link to="/admin/promotions" className="flex items-center gap-2">
            <img src={logoImage} alt="Clarity" className="h-8 rounded-sm" />
            <div>
              <p className="text-xs font-medium text-foreground">Clarity Admin</p>
              <p className="text-[10px] text-muted-foreground capitalize">{role}</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <div>
                  <p className="text-xs font-medium">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.sublabel}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start gap-2 text-xs text-muted-foreground">
            <LogOut className="w-3.5 h-3.5" />
            ออกจากระบบ
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link to="/admin/promotions" className="flex items-center gap-2">
            <img src={logoImage} alt="Clarity" className="h-7 rounded-sm" />
            <span className="text-xs font-medium">Admin</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
        <nav className="flex border-t border-border">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs transition-colors ${
                  active
                    ? "text-primary border-b-2 border-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto md:max-h-screen">
        <div className="md:hidden h-14" />
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
