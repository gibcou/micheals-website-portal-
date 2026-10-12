# Prestige Estate Management — Client Portal

A secure, role-based client portal for **Prestige Estate Management**, built on [Base44](https://base44.com). Estate owners get a private view of everything Prestige manages on their behalf — service requests, weekly reports, invoices, and a direct line to their estate advisor. Administrators get a full back-office dashboard.

The same codebase powers the web app, the iOS app, and the Android app (both published as native store builds via Base44's mobile app pipeline).

---

## Features

### Client Portal
- **Dashboard** — estate profile (location, type, advisor), live stats (open requests, invoices due, reports filed), recent requests and latest weekly reports.
- **Service Requests** — submit new requests (with optional photo attachment) and track status from submission to completion.
- **Weekly Reports** — read every weekly report with summary, actions taken, and photo galleries.
- **Invoices** — view engagement statements, filter by status, and mark invoices paid.
- **Messages** — a private, real-time messaging channel with the estate advisor.
- **Notifications** — in-app notification bell for new messages, request status changes, and overdue invoice reminders.

### Admin Dashboard
- **Overview** — estate/active request totals, request status distribution (server-side aggregation), recent activity, quick actions.
- **Needs Attention** — a dedicated queue of active requests sorted by priority.
- **Estates** — full CRUD for estate records, including advisor assignment, retainer and status (active / onboarding / paused).
- **Requests** — manage every service request: update status, schedule dates, assign staff, review attached photos.
- **Weekly Reports** — publish weekly reports (with photos) per estate.
- **Invoices** — create and manage invoices, plus **bulk-update** tools to move many invoices between statuses at once.
- **Messages** — reply to any client's conversation from one place.
- **Portal Preview** — admins can switch to "View Client Portal" to preview exactly what a client sees.

### Automation
- **Payment reminders** — a scheduled daily workflow finds overdue invoices and emails payment reminders automatically (`base44/workflows/Overdue Invoice Reminders.jsonc`).
- **Status notifications** — when a request's status changes or a new message arrives, the recipient is notified in-app (and by email templates where configured).

### Mobile & iOS Optimizations
- **Pull-to-refresh** — touch-based refresh on Requests, Reports, and Invoices; each page runs on React Query and a pull refetches the active queries so lists stay in sync with the server.
- **Bottom-sheet selects** — on viewports under 768px, the shared Select control renders options in a `vaul` bottom-sheet drawer (native-feel pickers); desktop keeps standard popover dropdowns.
- **Tab stack memory** — the mobile bottom navigation restores each tab's last visited sub-route (e.g. an invoice detail), and tapping the active tab resets it to its root.
- **Optimistic UI** — new message bubbles and invoice status changes appear instantly, rolling back automatically if the server call fails.
- **Native-feel layout** — safe-area insets, sticky bottom navigation, 44px touch targets, and disabled rubber-band scrolling.

---

## Security & Access Control

- **Authentication** — the platform's built-in auth (email/password, Google OAuth, OTP verification, password reset).
- **Row-Level Security (RLS)** on every entity:
  - Clients can only read/update records tied to their own `client_id` (their estate).
  - Administrators (`role: "admin"`) have full access.
  - Notification records are scoped to the recipient.
- **Route guards** — `/admin/*` routes redirect non-admin users to the client portal.
- **Private file storage** — client photo attachments are stored privately (signed URLs are generated on demand for viewing).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS, shadcn/ui, lucide-react, Recharts |
| Backend | Base44 (auth, database with RLS, storage, workflows, functions) |
| Realtime | Base44 entity subscriptions (live messaging) |
| Email | Base44 email templates (MJML) + scheduled workflows |
| Mobile | Base44 native wrapper (iOS / Android store builds) |

### Project Structure
```
index.html                  # entry point (mobile web-app meta, manifest)
public/                     # favicon, web manifest
src/
  App.jsx                   # router (client + admin routes, auth guards)
  components/
    portal/                 # shared client-portal layout, forms, shared UI
    admin/                  # admin-only widgets (bulk invoice update, charts)
    AuthLayout.jsx, ProtectedRoute.jsx, ...
  pages/
    portal/                 # ClientDashboard, ClientRequests, ClientReports, ClientInvoices, ClientMessages
    admin/                  # AdminDashboard, AdminEstates, AdminRequests, AdminActiveRequests, AdminReports, AdminInvoices, AdminMessages
    Login/Register/ForgotPassword/ResetPassword
base44/
  entities/                 # data schemas + RLS rules (Estate, ServiceRequest, WeeklyReport, Invoice, Message, Notification)
  functions/                # backend functions (notifications, overdue-invoice reminders)
  workflows/                # scheduled automations
  emails/                   # MJML email templates
```

### Data Entities
- **Estate** — property profile, client link, advisor, monthly retainer, status.
- **ServiceRequest** — title, description, category, priority, status, scheduled/completed dates, photo.
- **WeeklyReport** — title, week of, summary, actions taken, photos.
- **Invoice** — invoice number, amount, status (draft / sent / paid / overdue), issue/due/paid dates, reminder date.
- **Message** — per-estate conversation thread, sender role, read state.
- **Notification** — per-user in-app notifications.

---

## Getting Started

This project runs inside Base44 (the platform hosts the app, database, auth and backend). To run/deploy outside of Base44 (e.g. on Vercel), copy the environment template and configure the Base44 app credentials:

```bash
cp .env.example .env   # fill in your Base44 app id / URLs
npm install
npm run dev            # local dev
npm run build          # production build -> dist/
```

A `vercel.json` is included for Vercel deployment (SPA rewrites + Base44 API proxying).

---

## Publishing to the App Stores

1. In Base44, open **Publish → Mobile app → Check Your App** and run the App Store and Google Play scans (fix any findings with AI).
2. On a Builder plan or higher, go to **Publish → Mobile app → Build Store Files** to generate the Apple **IPA** and Google Play **AAB** (push-notification credentials can be added here too).
3. Submit the files through your own **App Store Connect** and **Google Play Console** accounts. Base44 prepares the files; store submission and review are handled by you.

The mobile app is a lightweight native wrapper around the published web app, so every update to this codebase flows straight to the store apps.

---

## Design

Luxury aesthetic: dark charcoal base (`#121212`), muted gold accents (`#C5A071`), Cormorant Garamond display headings, Inter body text.