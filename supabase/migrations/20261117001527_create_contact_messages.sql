/*
# Create contact_messages table (single-tenant, no auth)

1. New Tables
- `contact_messages`
  - `id` (uuid, primary key)
  - `name` (text, not null) - name of the person contacting
  - `email` (text, not null) - reply-to email
  - `subject` (text, not null) - message subject
  - `message` (text, not null) - message body
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `contact_messages`.
- Grant INSERT only to `anon` + `authenticated` (the public contact form writes; nothing reads via the Data API).
- INSERT-only policy: visitors can submit a message but can never read, modify or delete any message.
*/

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

GRANT INSERT (name, email, subject, message) ON contact_messages TO anon, authenticated;

DROP POLICY IF EXISTS "anon_insert_contact_messages" ON contact_messages;
CREATE POLICY "anon_insert_contact_messages"
ON contact_messages FOR INSERT
TO anon, authenticated
WITH CHECK (true);
