
-- Create knowledge_documents table
CREATE TABLE public.knowledge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  extracted_text TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

-- RLS policy: admins/editors can manage
CREATE POLICY "Staff can manage knowledge documents"
  ON public.knowledge_documents
  FOR ALL
  TO authenticated
  USING (is_admin_or_editor(auth.uid()))
  WITH CHECK (is_admin_or_editor(auth.uid()));

-- Create storage bucket for knowledge files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('knowledge', 'knowledge', false, 20971520);

-- Storage RLS: admins/editors can upload
CREATE POLICY "Staff can upload knowledge files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'knowledge' AND is_admin_or_editor(auth.uid())
  );

-- Storage RLS: admins/editors can read
CREATE POLICY "Staff can read knowledge files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'knowledge' AND is_admin_or_editor(auth.uid())
  );

-- Storage RLS: admins/editors can delete
CREATE POLICY "Staff can delete knowledge files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'knowledge' AND is_admin_or_editor(auth.uid())
  );
