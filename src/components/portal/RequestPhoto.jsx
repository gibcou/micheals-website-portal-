"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Image } from "@/components/ui/image";

// Renders a privately stored request photo by signing its file URI on the fly.
export default function RequestPhoto({ fileUri, className }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let active = true;
    const getSignedUrl = async () => {
      const { data, error } = await supabase.storage.from('request-photos').createSignedUrl(fileUri, 60);
      if (error) {
        console.error("Error creating signed URL", error);
      } else {
        if (active) setUrl(data.signedUrl);
      }
    };
    getSignedUrl();
    return () => { active = false; };
  }, [fileUri]);

  if (!url) return null;
  return <Image src={url} alt="Request photo" className={className} />;
}