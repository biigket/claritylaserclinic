import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/logo-clarity.jpeg";

const AdminLogin = () => {
  const [email, setEmail] = useState(() => localStorage.getItem("admin_email") || "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => !!localStorage.getItem("admin_email"));
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (remember) {
      localStorage.setItem("admin_email", email);
    } else {
      localStorage.removeItem("admin_email");
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: "เข้าสู่ระบบไม่สำเร็จ", description: error.message, variant: "destructive" });
    } else {
      // Check role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await (supabase.from("user_roles") as any)
          .select("role")
          .eq("user_id", user.id)
          .limit(1)
          .single();

        if (roleData?.role === "admin" || roleData?.role === "editor") {
          navigate("/admin/promotions");
        } else {
          await supabase.auth.signOut();
          toast({ title: "ไม่มีสิทธิ์เข้าถึง", description: "บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบ Admin", variant: "destructive" });
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <img src={logoImage} alt="Clarity" className="h-14 rounded-sm" />
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h1 className="font-display text-xl text-center text-foreground mb-1">Admin Portal</h1>
          <p className="text-xs text-muted-foreground text-center mb-6">เข้าสู่ระบบจัดการเว็บไซต์</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">อีเมล</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@clinic.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">รหัสผ่าน</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(!!checked)}
              />
              <Label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer">
                จดจำอีเมล
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
