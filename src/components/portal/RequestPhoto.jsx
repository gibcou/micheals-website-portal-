import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

// Renders a privately stored request photo by signing its file URI on the fly.
export default function RequestPhoto({ fileUri, className }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let active = true;
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri })
      .then((res) => { if (active) setUrl(res.signed_url); })
      .catch(() => {});
    return () => { active = false; };
  }, [fileUri]);

  if (!url) return null;
  return <Image src={url} alt="Request photo" className={className} />;
}