import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function daysPast(dueDate, today) {
  const due = new Date(dueDate + 'T00:00:00Z');
  const now = new Date(today + 'T00:00:00Z');
  return Math.floor((now - due) / 86400000);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Scheduled workflow invocations carry no end-user session; any
    // authenticated caller must be an admin.
    const user = await base44.auth.me();
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = todayISO();
    const cutoff = new Date(new Date(today + 'T00:00:00Z').getTime() - 7 * 86400000)
      .toISOString().split('T')[0];

    const { items } = await base44.asServiceRole.entities.Invoice.filter(
      { status: { $in: ['sent', 'overdue'] }, due_date: { $lt: cutoff } },
      { limit: 200 }
    );

    let sent = 0;
    let skipped = 0;
    const errors = [];

    for (const invoice of items) {
      if (invoice.reminder_sent_date) {
        skipped++;
        continue;
      }

      let client = null;
      try {
        client = await base44.asServiceRole.entities.User.get(invoice.client_id);
      } catch (e) {
        client = null;
      }
      if (!client || !client.email) {
        skipped++;
        continue;
      }

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: client.email,
          template_name: 'InvoiceOverdueReminder',
          variables: {
            client_name: client.full_name || 'there',
            invoice_number: invoice.invoice_number || '',
            estate_name: invoice.estate_name || 'your estate',
            amount: '$' + Number(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            due_date: invoice.due_date || '',
            days_overdue: String(daysPast(invoice.due_date, today)),
          },
        });
        await base44.asServiceRole.entities.Invoice.update(invoice.id, { reminder_sent_date: today });
        sent++;
      } catch (e) {
        errors.push({ invoice: invoice.invoice_number, error: e && e.message });
      }
    }

    return Response.json({ ok: true, checked: items.length, sent, skipped, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}