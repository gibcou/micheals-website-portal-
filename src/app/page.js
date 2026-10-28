"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
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
              router.replace("/login");
              return;
          }

          if (profile?.role === "admin") {
            router.replace("/admin/dashboard");
          } else {
            router.replace("/portal/dashboard");
          }
        } else {
          router.replace("/login");
        }
      } catch (e) {
        console.error("Error checking user session:", e);
        router.replace("/login");
      } finally {
        setChecking(false);
      }
    };

    checkUser();
  }, [router]);

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
