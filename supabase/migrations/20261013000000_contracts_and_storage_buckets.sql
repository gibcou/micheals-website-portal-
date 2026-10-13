-- request-photos and chat-attachments were referenced in app code and
-- chat-attachments already had storage.objects RLS policies, but neither
-- bucket actually existed (buckets and policies are separate - defining
-- a policy for a bucket id doesn't create the bucket). Created both,
-- plus a new "contracts" bucket, directly via storage.buckets (done in a
-- prior step against the live DB; included here for repo history).

-- request-photos: a client uploads under <estate_id>/<filename> when
-- submitting a service request; only that estate's client (or an admin)
-- may read/write it.
DROP POLICY IF EXISTS "Clients can upload photos for their own estate" ON storage.objects;
CREATE POLICY "Clients can upload photos for their own estate" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'request-photos'
    AND (storage.foldername(name))[1]::uuid IN (SELECT id FROM estates WHERE client_id = auth.uid())
  );
DROP POLICY IF EXISTS "Clients can read photos for their own estate" ON storage.objects;
CREATE POLICY "Clients can read photos for their own estate" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'request-photos'
    AND (storage.foldername(name))[1]::uuid IN (SELECT id FROM estates WHERE client_id = auth.uid())
  );
DROP POLICY IF EXISTS "Admins can manage request photos" ON storage.objects;
CREATE POLICY "Admins can manage request photos" ON storage.objects
  FOR ALL USING (bucket_id = 'request-photos' AND is_admin())
  WITH CHECK (bucket_id = 'request-photos' AND is_admin());

-- contracts table: tracks each estate's service contract, including
-- renewals (a renewal links back to the contract it replaces) and
-- signature status, ready for a DocuSign integration (envelope id/url)
-- once credentials are available.
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID NOT NULL REFERENCES estates(id) ON DELETE CASCADE,
  estate_name TEXT,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'new',
  renews_contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  document_url TEXT,
  docusign_envelope_id TEXT,
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage contracts" ON contracts;
CREATE POLICY "Admins can manage contracts" ON contracts FOR ALL USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Clients can see their own contracts" ON contracts;
CREATE POLICY "Clients can see their own contracts" ON contracts FOR SELECT USING (client_id = auth.uid());

-- contracts bucket: the signed/unsigned document for a contract, stored
-- under <contract_id>/<filename>.
DROP POLICY IF EXISTS "Clients can read their own contract documents" ON storage.objects;
CREATE POLICY "Clients can read their own contract documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'contracts'
    AND EXISTS (
      SELECT 1 FROM contracts WHERE id = (storage.foldername(name))[1]::uuid AND client_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Admins can manage contract documents" ON storage.objects;
CREATE POLICY "Admins can manage contract documents" ON storage.objects
  FOR ALL USING (bucket_id = 'contracts' AND is_admin())
  WITH CHECK (bucket_id = 'contracts' AND is_admin());
