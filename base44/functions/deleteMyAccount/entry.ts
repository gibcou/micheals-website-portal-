import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Securely deletes the signed-in client's account and all of their estate data.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role === 'admin') return Response.json({ error: 'Admin accounts cannot be deleted here.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    if (body.confirm !== 'DELETE') return Response.json({ error: 'Confirmation required.' }, { status: 400 });

    const uid = user.id;
    const sr = base44.asServiceRole;

    await Promise.allSettled([
      sr.entities.Estate.deleteMany({ client_id: uid }),
      sr.entities.ServiceRequest.deleteMany({ client_id: uid }),
      sr.entities.Invoice.deleteMany({ client_id: uid }),
      sr.entities.Message.deleteMany({ client_id: uid }),
      sr.entities.WeeklyReport.deleteMany({ client_id: uid }),
      sr.entities.Notification.deleteMany({ recipient_id: uid }),
    ]);

    await sr.entities.User.delete(uid);

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}