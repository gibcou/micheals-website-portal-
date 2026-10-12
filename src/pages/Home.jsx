import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";

export default function Home() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (error) {
              console.error("Error fetching profile", error);
              navigate("/login", { replace: true });
              return;
          }
          
          if (profile?.role === "admin") {
            navigate("/admin/dashboard", { replace: true });
          } else {
            navigate("/portal/dashboard", { replace: true });
          }
        } else {
          navigate("/login", { replace: true });
        }
      } catch (e) {
        console.error("Error checking user session:", e);
        navigate("/login", { replace: true });
      } finally {
        setChecking(false);
      }
    };

    checkUser();
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="font-display text-3xl mb-6">
          Prestige<span className="text-primary">.</span>
        </div>
        <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}