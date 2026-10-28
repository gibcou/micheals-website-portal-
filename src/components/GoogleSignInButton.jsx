"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { createNonce } from "@/lib/googleNonce";

/**
 * Renders Google's own "Sign in with Google" button via Google Identity
 * Services (GIS) instead of a redirect-based OAuth flow. GIS issues an ID
 * token directly to the browser, which is handed to
 * supabase.auth.signInWithIdToken -- Supabase never sees a Google OAuth
 * redirect, so the consent screen shows this app's own branding (name,
 * logo, domain) instead of the Supabase project's *.supabase.co host.
 */
export default function GoogleSignInButton({ onCredential, onError, disabled }) {
  const buttonRef = useRef(null);
  const nonceRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!scriptReady) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.id) return;

    let cancelled = false;

    (async () => {
      const nonce = await createNonce();
      if (cancelled) return;
      nonceRef.current = nonce;

      window.google.accounts.id.initialize({
        client_id: clientId,
        // FedCM is how Chrome is replacing third-party cookies for
        // identity flows; without this flag the prompt silently stops
        // working once third-party cookies are phased out for this user.
        use_fedcm_for_prompt: true,
        nonce: nonce.hashed,
        callback: async (response) => {
          try {
            await onCredentialRef.current?.(response.credential, nonce.raw);
          } catch (err) {
            onErrorRef.current?.(err);
          }
        },
      });

      if (buttonRef.current) {
        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "signin_with",
          logo_alignment: "left",
          width: 320,
        });
      }

      // One Tap -- a non-blocking prompt layered on top of the button.
      // Harmless no-op if the user already dismissed it recently or isn't
      // signed into a Google account in this browser.
      window.google.accounts.id.prompt();
    })();

    return () => {
      cancelled = true;
    };
  }, [scriptReady]);

  return (
    <div className={disabled ? "pointer-events-none opacity-50" : undefined}>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={buttonRef} />
    </div>
  );
}
