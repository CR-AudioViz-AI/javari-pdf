-- ═══════════════════════════════════════════════════════════════════════════
-- PDF BUILDER PRO - ENHANCED SCHEMA v2.0
-- Templates & Batch Processing
-- CR AudioViz AI - Fortune 50 Quality Standards
-- December 27, 2025
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- PDF TEMPLATES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pdf_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    description TEXT,
    thumbnail TEXT,
    fields JSONB NOT NULL,
    template_data JSONB,
    pages INTEGER DEFAULT 1,
    premium BOOLEAN DEFAULT false,
    public BOOLEAN DEFAULT false,
    downloads INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_user ON pdf_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON pdf_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_public ON pdf_templates(public) WHERE public = true;

ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own templates" ON pdf_templates;
CREATE POLICY "Users can manage own templates" ON pdf_templates 
    FOR ALL USING (auth.uid() = user_id OR public = true);

-- ═══════════════════════════════════════════════════════════════════════════
-- PDF GENERATIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pdf_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES pdf_templates(id),
    field_values JSONB,
    output_format VARCHAR(20) DEFAULT 'pdf',
    output_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generations_user ON pdf_generations(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- BATCH JOBS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS batch_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    operation VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    files JSONB NOT NULL,
    options JSONB DEFAULT '{}',
    progress INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batch_user ON batch_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_status ON batch_jobs(status);

ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own batch jobs" ON batch_jobs;
CREATE POLICY "Users can manage own batch jobs" ON batch_jobs FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- JOB QUEUE (for background processing)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS job_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_queue_status ON job_queue(status) WHERE status = 'pending';

-- ═══════════════════════════════════════════════════════════════════════════
-- SAVED DOCUMENTS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS saved_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    page_count INTEGER,
    thumbnail_url TEXT,
    tags TEXT[],
    folder_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_user ON saved_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_docs_folder ON saved_documents(folder_id);

ALTER TABLE saved_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own documents" ON saved_documents;
CREATE POLICY "Users can manage own documents" ON saved_documents FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- DOCUMENT FOLDERS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS document_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES document_folders(id),
    color VARCHAR(7),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_user ON document_folders(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- GRANTS
-- ═══════════════════════════════════════════════════════════════════════════

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

SELECT 'PDF Builder Pro Enhanced Schema Complete ✅' as status;
