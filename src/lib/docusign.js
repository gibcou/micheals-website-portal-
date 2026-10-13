// DocuSign isn't connected yet. Sending a contract for signature here
// only updates its status in our own database - no real envelope is
// created or emailed until this is wired up to the DocuSign eSignature
// API.
//
// To go live:
//   1. Create a DocuSign developer account (free sandbox) at
//      https://developers.docusign.com, then a production account later.
//   2. In the DocuSign admin console, create an Integration Key (OAuth
//      client id) and either set up JWT Grant (RSA keypair) or
//      Authorization Code Grant for server-side auth.
//   3. Note your Account ID and the API base URL for your account's
//      region (demo: account-d.docusign.com, production: account.docusign.com).
//   4. Store the Integration Key, User ID, Account ID and RSA private
//      key (or OAuth client secret) as environment secrets - never in
//      client-side code, since this app runs entirely in the browser
//      with the Supabase anon key. The actual envelope-creation call
//      has to happen server-side (a Supabase Edge Function is the
//      natural place), which can then also receive DocuSign's webhook
//      (Connect) to update contracts.status to "signed" automatically.
//   5. Replace sendForSignature() below with a call to that Edge
//      Function instead of the direct Supabase update.
import { supabase } from "@/lib/supabase/client";

export const isDocuSignConnected = false;

export async function sendForSignature(contractId) {
  const { error } = await supabase
    .from("contracts")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", contractId);
  if (error) throw error;
}

export async function markSigned(contractId) {
  const { error } = await supabase
    .from("contracts")
    .update({ status: "signed", signed_at: new Date().toISOString() })
    .eq("id", contractId);
  if (error) throw error;
}
