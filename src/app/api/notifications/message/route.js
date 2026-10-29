import { Resend } from "resend";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.prestigeestatemanagement.com";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Supabase Database Webhook on `messages` INSERT. Both the client and
// admin message pages send through the same sendMessage() helper into
// the same table, so this one route covers notifications in both
// directions. Authenticated by a shared secret header configured on the
// webhook itself, since this endpoint is otherwise unauthenticated
// (Supabase calls it server-to-server, not as a logged-in user).
export async function POST(request) {
  const expectedSecret = process.env.MESSAGE_WEBHOOK_SECRET;
  const providedSecret = request.headers.get("x-webhook-secret");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (payload.type !== "INSERT" || payload.table !== "messages") {
    // Not an error -- just not something this route needs to act on.
    return NextResponse.json({ ok: true, skipped: true });
  }

  const record = payload.record;
  if (!record?.conversation_id || !record?.sender_id) {
    return NextResponse.json({ error: "Malformed record" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const admin = createAdminClient();

  if (!apiKey || !admin) {
    // Can't send anything without these, but this is a best-effort
    // notification on top of the in-app message that already exists --
    // never fail the webhook response over it, that would just make
    // Supabase retry a call that can't succeed until config is fixed.
    console.error(
      "notifications/message: RESEND_API_KEY / SUPABASE_SERVICE_ROLE_KEY not set -- skipping email notification."
    );
    return NextResponse.json({ ok: true, emailSkipped: true });
  }

  try {
    const { data: sender } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", record.sender_id)
      .single();

    const { data: participants } = await admin
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", record.conversation_id)
      .neq("user_id", record.sender_id);

    const recipientIds = (participants || []).map((p) => p.user_id);
    if (recipientIds.length === 0) {
      return NextResponse.json({ ok: true, recipients: 0 });
    }

    const { data: recipients } = await admin
      .from("profiles")
      .select("id, full_name, email, role")
      .in("id", recipientIds);

    const senderName = sender?.full_name || sender?.email || "Someone";
    const bodySnippet = String(record.body || "").slice(0, 300);
    const resend = new Resend(apiKey);

    const sends = (recipients || [])
      .filter((r) => r.email)
      .map((r) => {
        const messagesPath = r.role === "admin" ? "/admin/messages" : "/portal/messages";
        const link = `${SITE_URL}/clientportal${messagesPath}`;
        return resend.emails
          .send({
            from: `Prestige Estate Management <${fromAddress}>`,
            to: r.email,
            subject: `New message from ${senderName}`,
            html: `
              <p><strong>${escapeHtml(senderName)}</strong> sent you a new message:</p>
              <p style="padding:12px 16px;background:#f4f4f4;border-radius:8px">${escapeHtml(
                bodySnippet
              ).replace(/\n/g, "<br/>")}</p>
              <p><a href="${link}">Reply in the client portal</a></p>
            `,
          })
          .catch((err) => {
            console.error("notifications/message: failed to send to", r.email, err);
          });
      });

    await Promise.all(sends);

    return NextResponse.json({ ok: true, recipients: sends.length });
  } catch (err) {
    console.error("notifications/message: unexpected error", err);
    // Still 200 -- the message itself was already saved successfully;
    // this is a secondary notification and shouldn't trigger webhook
    // retries that can't fix a code-level error anyway.
    return NextResponse.json({ ok: true, error: "notification failed" });
  }
}
