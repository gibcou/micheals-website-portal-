import jsPDF from "jspdf";

const BRAND = "Prestige Estate Management";
const PRIMARY = [181, 142, 92]; // approximates the app's gold accent
const MUTED = [110, 110, 110];
const DARK = [30, 30, 30];

function letterhead(doc, eyebrow) {
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...DARK);
  doc.text(BRAND, 20, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PRIMARY);
  doc.text(eyebrow.toUpperCase(), 20, 29);

  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(20, 33, 190, 33);
}

function labelValue(doc, label, value, x, y) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(String(value ?? "—"), x, y + 6);
}

export function downloadInvoicePdf(invoice) {
  const doc = new jsPDF();
  letterhead(doc, "Billing Statement");

  doc.setFont("times", "normal");
  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  doc.text(`Invoice ${invoice.invoice_number || ""}`, 20, 48);

  if (invoice.estate_name) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY);
    doc.text(invoice.estate_name, 20, 56);
  }

  labelValue(doc, "Issue Date", invoice.issue_date, 20, 72);
  labelValue(doc, "Due Date", invoice.due_date, 80, 72);
  labelValue(doc, "Status", (invoice.status || "").replace(/_/g, " "), 140, 72);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("AMOUNT DUE", 20, 92);
  doc.setFont("times", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...DARK);
  doc.text(`$${Number(invoice.amount || 0).toLocaleString()}`, 20, 104);

  if (invoice.description) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("DESCRIPTION", 20, 120);
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(doc.splitTextToSize(invoice.description, 170), 20, 127);
  }

  if (invoice.status === "paid" && invoice.paid_date) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(16, 130, 90);
    doc.text(`Paid on ${invoice.paid_date}`, 20, 150);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Generated " + new Date().toLocaleDateString(), 20, 280);

  doc.save(`${invoice.invoice_number || "invoice"}.pdf`);
}

export function downloadContractPdf(contract) {
  const doc = new jsPDF();
  letterhead(doc, "Service Agreement");

  doc.setFont("times", "normal");
  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  const titleLines = doc.splitTextToSize(contract.title || "Service Agreement", 170);
  doc.text(titleLines, 20, 48);

  const afterTitleY = 48 + titleLines.length * 7;

  if (contract.estate_name) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY);
    doc.text(contract.estate_name, 20, afterTitleY + 3);
  }

  const topY = afterTitleY + 20;
  labelValue(doc, "Term Start", contract.start_date, 20, topY);
  labelValue(doc, "Term End", contract.end_date, 80, topY);
  labelValue(doc, "Status", (contract.status || "").replace(/_/g, " "), 140, topY);

  const bodyY = topY + 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  const boilerplate =
    "This agreement confirms that Prestige Estate Management will provide property " +
    "care, maintenance coordination, and advisory services for the property named above, " +
    "for the term stated, in accordance with the standard terms of engagement on file with " +
    "the client's account.";
  doc.text(doc.splitTextToSize(boilerplate, 170), 20, bodyY);

  let notesY = bodyY + 24;
  if (contract.notes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("NOTES", 20, notesY);
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    const noteLines = doc.splitTextToSize(contract.notes, 170);
    doc.text(noteLines, 20, notesY + 7);
    notesY += 7 + noteLines.length * 5;
  }

  const sigY = Math.max(notesY + 20, 220);
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.2);
  doc.line(20, sigY, 100, sigY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Client Signature", 20, sigY + 5);

  if (contract.status === "signed" && contract.signed_at) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(16, 130, 90);
    doc.text(`Signed electronically on ${new Date(contract.signed_at).toLocaleDateString()}`, 20, sigY + 16);
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("Awaiting signature", 20, sigY + 16);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Generated " + new Date().toLocaleDateString(), 20, 280);

  doc.save(`${(contract.title || "contract").replace(/[^a-z0-9]+/gi, "-")}.pdf`);
}
