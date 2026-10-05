import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

function previewOf(body) {
  const text = (body || '').trim().replace(/\s+/g, ' ');
  return text.length > 140 ? text.slice(0, 140) + '…' : text;
}

// Creates in-app notifications (no email) for a new message:
// a client's message notifies every admin, an admin's message notifies the client.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { message_id } = await req.json();
    if (!message_id) return Response.json({ error: 'message_id is required' }, { status: 400 });

    const message = await base44.asServiceRole.entities.Message.get(message_id);
    if (!message) return Response.json({ error: 'Message not found' }, { status: 404 });

    const preview = previewOf(message.body);

    // Resolve the sender's name from whoever created the message
    let senderName = '';
    try {
      const sender = await base44.asServiceRole.entities.User.get(message.created_by_id);
      senderName = sender && sender.full_name ? sender.full_name : '';
    } catch (e) {
      senderName = '';
    }

    // Resolve the estate name if not stored on the message
    let estateName = message.estate_name || '';
    if (!estateName && message.estate_id) {
      try {
        const estate = await base44.asServiceRole.entities.Estate.get(message.estate_id);
        estateName = estate ? estate.name : '';
      } catch (e) {
        estateName = '';
      }
    }

    let recipients = [];
    let link = '';

    if (message.from_role === 'client') {
      // Notify every admin user
      recipients = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      link = '/admin/messages';
    } else {
      // Notify the client this thread belongs to
      let client = null;
      try {
        client = await base44.asServiceRole.entities.User.get(message.client_id);
      } catch (e) {
        client = null;
      }
      if (client) recipients = [client];
      link = '/portal/messages';
    }

    const title = message.from_role === 'client'
      ? (senderName || 'New client message')
      : (senderName || 'New message from your advisor');
    const body = estateName ? `${estateName}: ${preview}` : preview;

    const notifications = recipients
      .filter((r) => r.id && r.id !== message.created_by_id)
      .map((r) => ({ recipient_id: r.id, title, body, link, read: false }));

    if (notifications.length) {
      await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
    }

    return Response.json({ ok: true, notified: notifications.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}