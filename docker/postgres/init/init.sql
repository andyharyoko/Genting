-- ==========================================
-- GENTING: Gerakan Terpadu Intervensi Stunting
-- Database Schema for PostgreSQL with PostGIS
-- ==========================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- For NIK encryption

-- 1. Master Tables
CREATE TABLE m_user (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('KADER', 'ADMIN_DESA', 'ADMIN_KEC', 'ADMIN_KAB')),
    wilayah_id VARCHAR(20), -- Kode BPS (Desa/Kec/Kab)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE m_posyandu (
    posyandu_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_posyandu VARCHAR(100) NOT NULL,
    kode_desa VARCHAR(20) NOT NULL, -- Kode BPS
    lokasi_geospatial GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE m_who_lms (
    lms_id SERIAL PRIMARY KEY,
    gender SMALLINT, -- 1: Laki-laki, 2: Perempuan
    age_months INT,
    l DECIMAL(10,4),
    m DECIMAL(10,4),
    s DECIMAL(10,4),
    type VARCHAR(20) -- 'height_for_age', 'weight_for_age', 'weight_for_height'
);

-- Custom ID Function for m_balita (Format: YYYYMMDD-HHMISS-MICRO)
CREATE OR REPLACE FUNCTION fn_generate_balita_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
BEGIN
    new_id := to_char(NOW(), 'YYYYMMDD-HH24MISS-') || LPAD(EXTRACT(MICROSECONDS FROM NOW())::TEXT, 6, '0');
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE m_balita (
    balita_id TEXT PRIMARY KEY DEFAULT fn_generate_balita_id(),
    nik_encrypted BYTEA, -- Encrypted column for Privacy
    nama_lengkap VARCHAR(150) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    jenis_kelamin SMALLINT NOT NULL, -- 1: Laki, 2: Perempuan
    alamat TEXT,
    kode_desa VARCHAR(20) NOT NULL, -- For RLS
    posyandu_id UUID REFERENCES m_posyandu(posyandu_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Transactional Tables
CREATE TABLE t_antropometri (
    antropometri_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balita_id TEXT REFERENCES m_balita(balita_id),
    tanggal_ukur DATE DEFAULT CURRENT_DATE,
    berat_badan DECIMAL(5,2), -- kg
    tinggi_badan DECIMAL(5,2), -- cm
    lingkar_kepala DECIMAL(5,2),
    z_score_hfa DECIMAL(5,2), -- Height for Age
    z_score_wfa DECIMAL(5,2), -- Weight for Age
    status_stunting VARCHAR(50),
    kader_id UUID REFERENCES m_user(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE t_mbg ( -- Makan Bergizi Gratis / Intervensi
    mbg_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balita_id TEXT REFERENCES m_balita(balita_id),
    tanggal_intervensi DATE DEFAULT CURRENT_DATE,
    jenis_makanan TEXT,
    kalori INT,
    petugas_id UUID REFERENCES m_user(user_id),
    catatan TEXT
);

-- 3. Row-Level Security (RLS) Policies
ALTER TABLE m_balita ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_antropometri ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_mbg ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy for m_balita based on role prefix matching BPS codes
CREATE POLICY p_balita_wilayah_access ON m_balita
USING (
    (SELECT role FROM m_user WHERE user_id = auth_user_id()) = 'ADMIN_KAB' OR
    (SELECT wilayah_id FROM m_user WHERE user_id = auth_user_id()) = SUBSTRING(kode_desa, 1, LENGTH((SELECT wilayah_id FROM m_user WHERE user_id = auth_user_id())))
);

-- Similar policies for transaction tables
CREATE POLICY p_antropometri_wilayah_access ON t_antropometri
USING (
    EXISTS (
        SELECT 1 FROM m_balita b 
        WHERE b.balita_id = t_antropometri.balita_id 
        AND b.kode_desa LIKE (SELECT wilayah_id || '%' FROM m_user WHERE user_id = auth_user_id())
    )
);

-- 4. Encryption Layer (Simplified Example)
-- In production, the key should be managed via HashiCorp Vault or similar KMS
-- We use a placeholder 'secret_key_genting'
CREATE OR REPLACE FUNCTION fn_encrypt_nik(raw_nik TEXT)
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(raw_nik, 'secret_key_genting');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_decrypt_nik(encrypted_nik BYTEA)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_nik, 'secret_key_genting');
END;
$$ LANGUAGE plpgsql;

-- 5. Indexes for Geospatial and Performance
CREATE INDEX idx_posyandu_geom ON m_posyandu USING GIST (lokasi_geospatial);
CREATE INDEX idx_balita_desa ON m_balita(kode_desa);
CREATE INDEX idx_antropometri_tanggal ON t_antropometri(tanggal_ukur);
