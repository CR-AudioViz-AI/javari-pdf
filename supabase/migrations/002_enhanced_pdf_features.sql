-- ═══════════════════════════════════════════════════════════════════════════
-- PDF BUILDER PRO - ENHANCED SCHEMA
-- CR AudioViz AI - Fortune 50 Quality Standards
-- December 27, 2025
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- CERTIFICATE RECORDS (For Digital Signatures)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS certificate_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    signer_name VARCHAR(255) NOT NULL,
    signer_email VARCHAR(255),
    reason TEXT,
    document_hash VARCHAR(64) NOT NULL,
    document_name VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for certificate lookups
CREATE INDEX IF NOT EXISTS idx_certificate_records_cert_id ON certificate_records(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificate_records_user_id ON certificate_records(user_id);
CREATE INDEX IF NOT EXISTS idx_certificate_records_doc_hash ON certificate_records(document_hash);
CREATE INDEX IF NOT EXISTS idx_certificate_records_created ON certificate_records(created_at DESC);

-- RLS Policy
ALTER TABLE certificate_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates"
    ON certificate_records FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create certificates"
    ON certificate_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- SIGNATURE AUDIT LOG
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS signature_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    operation VARCHAR(50) NOT NULL,
    certificate_id VARCHAR(50),
    document_name VARCHAR(255),
    document_hash VARCHAR(64),
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_signature_audit_user ON signature_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_signature_audit_timestamp ON signature_audit_log(timestamp DESC);

ALTER TABLE signature_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit log"
    ON signature_audit_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit log"
    ON signature_audit_log FOR INSERT
    WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- PDF PROCESSING HISTORY
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pdf_processing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    operation VARCHAR(50) NOT NULL,
    operation_category VARCHAR(20) NOT NULL,
    input_file_name VARCHAR(255),
    input_file_size BIGINT,
    input_page_count INTEGER,
    output_file_name VARCHAR(255),
    output_file_size BIGINT,
    output_page_count INTEGER,
    credits_used INTEGER NOT NULL DEFAULT 0,
    processing_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'completed',
    error_message TEXT,
    parameters JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pdf_history_user ON pdf_processing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_history_operation ON pdf_processing_history(operation);
CREATE INDEX IF NOT EXISTS idx_pdf_history_created ON pdf_processing_history(created_at DESC);

ALTER TABLE pdf_processing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own processing history"
    ON pdf_processing_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert processing history"
    ON pdf_processing_history FOR INSERT
    WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- PDF TEMPLATES (User-created and system templates)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pdf_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    thumbnail_url TEXT,
    template_data JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false,
    downloads INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pdf_templates_user ON pdf_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_templates_category ON pdf_templates(category);
CREATE INDEX IF NOT EXISTS idx_pdf_templates_public ON pdf_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_pdf_templates_tags ON pdf_templates USING GIN(tags);

ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
    ON pdf_templates FOR SELECT
    USING (auth.uid() = user_id OR is_public = true OR is_system = true);

CREATE POLICY "Users can create templates"
    ON pdf_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
    ON pdf_templates FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
    ON pdf_templates FOR DELETE
    USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- SAVED FORM DATA (For reusing form field values)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS saved_form_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    form_type VARCHAR(100),
    field_values JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_form_user ON saved_form_data(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_form_type ON saved_form_data(form_type);

ALTER TABLE saved_form_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved forms"
    ON saved_form_data FOR ALL
    USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- USER SIGNATURES (Saved signatures for reuse)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('draw', 'type', 'image')),
    signature_data TEXT NOT NULL,
    font_family VARCHAR(100),
    color VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_signatures_user ON user_signatures(user_id);

ALTER TABLE user_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own signatures"
    ON user_signatures FOR ALL
    USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- BATCH JOBS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pdf_batch_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    total_files INTEGER NOT NULL,
    processed_files INTEGER DEFAULT 0,
    failed_files INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    parameters JSONB DEFAULT '{}'::jsonb,
    results JSONB DEFAULT '[]'::jsonb,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batch_jobs_user ON pdf_batch_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON pdf_batch_jobs(status);

ALTER TABLE pdf_batch_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own batch jobs"
    ON pdf_batch_jobs FOR ALL
    USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Log PDF operation with automatic history tracking
CREATE OR REPLACE FUNCTION log_pdf_operation(
    p_user_id UUID,
    p_operation VARCHAR(50),
    p_category VARCHAR(20),
    p_input_file VARCHAR(255),
    p_input_size BIGINT,
    p_output_file VARCHAR(255),
    p_output_size BIGINT,
    p_credits INTEGER,
    p_processing_time INTEGER DEFAULT NULL,
    p_parameters JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO pdf_processing_history (
        user_id, operation, operation_category,
        input_file_name, input_file_size,
        output_file_name, output_file_size,
        credits_used, processing_time_ms, parameters
    ) VALUES (
        p_user_id, p_operation, p_category,
        p_input_file, p_input_size,
        p_output_file, p_output_size,
        p_credits, p_processing_time, p_parameters
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's PDF operation stats
CREATE OR REPLACE FUNCTION get_pdf_operation_stats(p_user_id UUID)
RETURNS TABLE (
    operation VARCHAR(50),
    total_operations BIGINT,
    total_credits_used BIGINT,
    avg_processing_time NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.operation,
        COUNT(*)::BIGINT as total_operations,
        SUM(h.credits_used)::BIGINT as total_credits_used,
        AVG(h.processing_time_ms)::NUMERIC as avg_processing_time
    FROM pdf_processing_history h
    WHERE h.user_id = p_user_id
    GROUP BY h.operation
    ORDER BY total_operations DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify certificate
CREATE OR REPLACE FUNCTION verify_certificate(
    p_certificate_id VARCHAR(50),
    p_document_hash VARCHAR(64)
)
RETURNS TABLE (
    valid BOOLEAN,
    signer_name VARCHAR(255),
    signed_at TIMESTAMPTZ,
    reason TEXT,
    hash_match BOOLEAN,
    is_revoked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN c.id IS NULL THEN false
            WHEN c.revoked_at IS NOT NULL THEN false
            WHEN c.expires_at IS NOT NULL AND c.expires_at < NOW() THEN false
            ELSE true
        END as valid,
        c.signer_name,
        c.created_at as signed_at,
        c.reason,
        (c.document_hash = p_document_hash) as hash_match,
        (c.revoked_at IS NOT NULL) as is_revoked
    FROM certificate_records c
    WHERE c.certificate_id = p_certificate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- INSERT SYSTEM TEMPLATES
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO pdf_templates (name, description, category, is_system, is_public, template_data, tags)
VALUES 
    ('Business Proposal', 'Professional business proposal template', 'business', true, true, 
     '{"pages": 1, "elements": [], "settings": {"pageSize": "letter", "margins": {"top": 72, "right": 72, "bottom": 72, "left": 72}}}',
     ARRAY['business', 'proposal', 'professional']),
    ('Invoice', 'Standard invoice template', 'business', true, true,
     '{"pages": 1, "elements": [], "settings": {"pageSize": "letter"}}',
     ARRAY['invoice', 'billing', 'business']),
    ('Contract', 'Basic contract template', 'legal', true, true,
     '{"pages": 1, "elements": [], "settings": {"pageSize": "letter"}}',
     ARRAY['contract', 'legal', 'agreement']),
    ('Resume', 'Professional resume template', 'resume', true, true,
     '{"pages": 1, "elements": [], "settings": {"pageSize": "letter"}}',
     ARRAY['resume', 'cv', 'career']),
    ('Certificate', 'Award certificate template', 'certificate', true, true,
     '{"pages": 1, "elements": [], "settings": {"pageSize": "letter", "orientation": "landscape"}}',
     ARRAY['certificate', 'award', 'achievement']),
    ('Report', 'Technical report template', 'business', true, true,
     '{"pages": 1, "elements": [], "settings": {"pageSize": "letter"}}',
     ARRAY['report', 'technical', 'documentation'])
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 'PDF Builder Pro Enhanced Schema - Tables Created:' as status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'certificate_records',
    'signature_audit_log', 
    'pdf_processing_history',
    'pdf_templates',
    'saved_form_data',
    'user_signatures',
    'pdf_batch_jobs'
)
ORDER BY table_name;
