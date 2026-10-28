// Google Identity Services + Supabase's signInWithIdToken both want a
// nonce, but they want different forms of it: Google gets the SHA-256
// hash (so the ID token it issues embeds that hash in its own `nonce`
// claim), and Supabase gets the original raw value, which it hashes
// itself to verify against that claim. Sending the same raw value to both
// would make the comparison on Supabase's side fail.
export async function createNonce() {
  const raw = crypto.randomUUID();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { raw, hashed };
}
