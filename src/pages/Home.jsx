import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function Home() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then((user) => {
        if (user?.role === "admin") navigate("/admin/dashboard", { replace: true });
        else navigate("/portal/dashboard", { replace: true });
      })
      .catch(() => navigate("/login", { replace: true }))
      .finally(() => setChecking(false));
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