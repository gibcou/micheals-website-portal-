# Micheal's Website Portal

This is a client portal application built with React, Vite, and Supabase. It provides a secure way for clients to communicate with their advisors, manage service requests, and view reports and invoices.

![Screenshot of the application](https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=A%20client%20portal%20dashboard%20with%20a%20clean%20and%20modern%20design.%20The%20dashboard%20shows%20stats%20for%20open%20requests,%20invoices%20due,%20and%20reports%20filed.%20There%20is%20also%20a%20list%20of%20recent%20requests%20and%20latest%20reports.&image_size=landscape_16_9)

## Architecture

The application is built with a modern JavaScript stack:

*   **Frontend**: A single-page application built with **React** and **Vite**. It uses **Tailwind CSS** for styling and **shadcn/ui** for UI components.
*   **Backend**: The backend is powered by **Supabase**. We use Supabase for:
    *   **Authentication**: Secure user authentication with email and password.
    *   **Database**: A PostgreSQL database to store all application data.
    *   **Storage**: Secure file storage for message attachments.
    *   **Edge Functions**: Serverless functions for secure, server-side logic.
*   **Security**: The application uses Supabase's Row Level Security (RLS) to ensure that users can only access their own data. All sensitive operations are handled by secure Supabase Edge Functions.

## Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm
*   A Supabase account

### 1. Clone the repository

```bash
git clone https://github.com/gibcou/micheals-website-portal-.git
cd micheals-website-portal-
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1.  Create a new project on [Supabase](https://app.supabase.io).
2.  Go to the **SQL Editor** in your Supabase project.
3.  Copy the entire content of `supabase/migrations/20261012_initial_schema.sql` and run it in the SQL editor. This script is idempotent, meaning you can run it multiple times without causing errors. It will only create the tables and objects that don't already exist.
4.  Go to **Project Settings** > **API** and find your **Project URL** and **Public (anon) key**.
5.  Create a new file named `.env.local` in the root of the project and add the following, replacing the values with your own:

    ```
    VITE_SUPABASE_URL="your-supabase-url"
    VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
    ```

### 4. Run the application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Backend

The backend logic is handled by Supabase Edge Functions, located in the `supabase/functions` directory. These functions are written in TypeScript and are deployed to Supabase.

*   `create-conversation`: A secure endpoint for creating new conversations. It can only be called by authenticated admin users.

To deploy new or updated edge functions, use the Supabase CLI:

```bash
supabase functions deploy --project-ref <your-project-ref>
```
