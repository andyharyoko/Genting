# GentingV2 System & Architecture Diagrams

Kumpulan diagram teknis interaktif untuk sistem **GentingV2 (Stunting Monitoring & Geospatial Intervention System)**, digenerate menggunakan **Archify Skill** dengan profil `showcase` (9/9 automated artifact & composition checks passed).

Semua file HTML dapat dibuka langsung di browser (standalone) lengkap dengan dukungan:
- **Theme Switching** (Dark / Light Mode)
- **Interactive Pan & Zoom**
- **Guided Chapter Views**
- **Path Highlighting & Focus**
- **Trace Animation**
- **Export ke PNG / SVG / WebP / WebM**

---

## Daftar Diagram

### 1. [System Architecture Diagram](genting_system_architecture.html)
- **File Spesifikasi**: `genting_system_architecture.json`
- **Tipe**: `architecture`
- **Deskripsi**:
  Menampilkan topologi sistem end-to-end:
  - **Client Tier**: WebGIS React 19 (port 8010) & Flutter Mobile App (SQLite offline).
  - **Ingress / Gateway**: Nginx container (port 8010) menangani SPA routing dan reverse proxy `/api/`.
  - **Backend**: Laravel 13 (PHP 8.4-cli, port 8011 internal).
  - **Security & Scope**: Sanctum Bearer Token & EnsureWilayahRLS middleware.
  - **Engine**: WHO LMS Z-Score Calculation Engine.
  - **Persistence**: PostgreSQL 15 + PostGIS (`genting_db`) dan Redis 7 (`genting_redis`).
  - **Spatial Zone**: ST_Buffer radius 2km untuk analisis klaster stunting & Dapur Umum MBG.

### 2. [Stunting Screening & Geospatial Data Flow](stunting_screening_dataflow.html)
- **File Spesifikasi**: `stunting_screening_dataflow.json`
- **Tipe**: `dataflow`
- **Deskripsi**:
  Menjelaskan alur data pengukuran antropometri dalam 5 tahap:
  1. **Collection**: Kader posyandu menginput BB, TB, LILA, dan posisi ukur.
  2. **Ingest**: Validasi payload dan pemisahan wilayah hak akses melalui Sanctum middleware.
  3. **Evaluation**: Koreksi posisi tinggi badan (+/- 0.7cm) dan evaluasi Z-Score terhadap tabel `m_who_lms` (HAZ, WAZ, WHZ).
  4. **Persistence**: Penyimpanan status gizi terklasifikasi ke `t_antropometri` dan geometri ke PostGIS.
  5. **Intervention**: Visualisasi grafik KMS digital dan pemetaan kepadatan kasus stunting untuk alokasi logistik MBG.

### 3. [Offline-First Field Sync Sequence Diagram](offline_sync_sequence.html)
- **File Spesifikasi**: `offline_sync_sequence.json`
- **Tipe**: `sequence`
- **Deskripsi**:
  Menjelaskan protokol sinkronisasi offline-first antara aplikasi mobile kader dan cloud:
  - Pencatatan lokal tanpa internet ke SQLite dengan flag `sync_status=0`.
  - Triger sinkronisasi massal via `POST /api/v1/sync/antropometri`.
  - Nginx gateway meneruskan request ke Laravel API.
  - Verifikasi token dan lingkup wilayah posyandu kader.
  - Transaksi database server mengeksekusi perhitungan Z-Score dan menghasilkan server ID.
  - Respon 200 JSON diterima client untuk memperbarui status lokal `sync_status=1`.

---

## Cara Membuka Diagram

Buka file [index.html](index.html) atau langsung buka salah satu file HTML di atas menggunakan peramban web (browser).
