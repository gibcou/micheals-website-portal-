import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { request_id, status } = await req.json();
    if (!request_id || !status) {
      return Response.json({ error: 'request_id and status are required' }, { status: 400 });
    }

    const request = await base44.entities.ServiceRequest.get(request_id);
    if (!request) return Response.json({ error: 'Request not found' }, { status: 404 });

    const completed_date = status === 'completed' ? new Date().toISOString().split('T')[0] : null;
    await base44.entities.ServiceRequest.update(request_id, { status, completed_date });

    let notified = false;
    try {
      const client = await base44.asServiceRole.entities.User.get(request.client_id);
      if (client && client.email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: client.email,
          template_name: 'ServiceRequestUpdate',
          variables: {
            client_name: client.full_name || 'there',
            request_title: request.title || 'your request',
            estate_name: request.estate_name || '',
            status: String(status).replace(/_/g, ' '),
          },
        });
        notified = true;
      }
    } catch (notifyError) {
      // Status was saved; notification failure should not fail the update
      console.error('Notification failed:', notifyError && notifyError.message);
    }

    return Response.json({ ok: true, notified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}