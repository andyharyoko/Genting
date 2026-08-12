<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class RegionAndUserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Regions (Mock Data)
        DB::table('m_provinsi')->insertOrIgnore([
            ['id' => '35', 'nama' => 'JAWA TIMUR', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('m_kabupaten')->insertOrIgnore([
            ['id' => '3523', 'provinsi_id' => '35', 'nama' => 'KABUPATEN TUBAN', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('m_puskesmas')->insertOrIgnore([
            ['id' => 1, 'kabupaten_id' => '3523', 'nama' => 'Puskesmas Kenduruhan', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'kabupaten_id' => '3523', 'nama' => 'Puskesmas Montong', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('m_kecamatan')->insertOrIgnore([
            ['id' => '352301', 'kabupaten_id' => '3523', 'nama' => 'KENDURUAN', 'created_at' => now(), 'updated_at' => now()],
            ['id' => '352302', 'kabupaten_id' => '3523', 'nama' => 'JATIROGO', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('m_desa')->insertOrIgnore([
            ['id' => '3523012001', 'kecamatan_id' => '352301', 'nama' => 'SOKOGRENJENG', 'created_at' => now(), 'updated_at' => now()],
            ['id' => '3523012002', 'kecamatan_id' => '352301', 'nama' => 'JLODRO', 'created_at' => now(), 'updated_at' => now()],
            ['id' => '3523012003', 'kecamatan_id' => '352301', 'nama' => 'BENDONGLATENG', 'created_at' => now(), 'updated_at' => now()],
            ['id' => '3523012004', 'kecamatan_id' => '352301', 'nama' => 'SIDOHASRI', 'created_at' => now(), 'updated_at' => now()],
            ['id' => '3523012005', 'kecamatan_id' => '352301', 'nama' => 'JAMPRAN', 'created_at' => now(), 'updated_at' => now()],
            ['id' => '3523012006', 'kecamatan_id' => '352301', 'nama' => 'SIDOMUKTI', 'created_at' => now(), 'updated_at' => now()],
            ['id' => '3523022001', 'kecamatan_id' => '352302', 'nama' => 'SUGIHWARAS', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // 2. Seed Users (Demo untuk semua Level 0-7)
        
        // Level 0: Orang Tua
        User::updateOrCreate(['email' => 'orangtua@genting.id'], [
            'name' => 'Budi Santoso (Orang Tua)',
            'password' => Hash::make('password'),
            'role_level' => 0,
            'provinsi_id' => '35',
            'kabupaten_id' => '3523',
            'kecamatan_id' => '352301',
            'desa_id' => '3523012001',
            'puskesmas_id' => 1,
        ]);

        // Level 1: Kader
        User::updateOrCreate(['email' => 'kader@genting.id'], [
            'name' => 'Siti Aminah (Kader)',
            'password' => Hash::make('password'),
            'role_level' => 1,
            'provinsi_id' => '35',
            'kabupaten_id' => '3523',
            'kecamatan_id' => '352301',
            'desa_id' => '3523012001',
            'puskesmas_id' => 1,
        ]);

        // Level 2: Bidan
        User::updateOrCreate(['email' => 'bidan@genting.id'], [
            'name' => 'Bidan Sari (Bidan Desa)',
            'password' => Hash::make('password'),
            'role_level' => 2,
            'provinsi_id' => '35',
            'kabupaten_id' => '3523',
            'kecamatan_id' => '352301',
            'desa_id' => '3523012001',
            'puskesmas_id' => 1,
        ]);

        // Level 3: Puskesmas
        User::updateOrCreate(['email' => 'puskesmas@genting.id'], [
            'name' => 'Admin Puskesmas Kenduruan',
            'password' => Hash::make('password'),
            'role_level' => 3,
            'provinsi_id' => '35',
            'kabupaten_id' => '3523',
            'kecamatan_id' => '352301',
            'desa_id' => null,
            'puskesmas_id' => 1,
        ]);

        // Level 4: Kabupaten (Admin GIS)
        User::updateOrCreate(['email' => 'kabupaten@genting.id'], [
            'name' => 'Admin Dinkes Tuban',
            'password' => Hash::make('password'),
            'role_level' => 4,
            'provinsi_id' => '35',
            'kabupaten_id' => '3523',
            'kecamatan_id' => null,
            'desa_id' => null,
        ]);
        
        // Level 5: Provinsi
        User::updateOrCreate(['email' => 'provinsi@genting.id'], [
            'name' => 'Admin Dinkes Jatim',
            'password' => Hash::make('password'),
            'role_level' => 5,
            'provinsi_id' => '35',
            'kabupaten_id' => null,
            'kecamatan_id' => null,
            'desa_id' => null,
        ]);

        // Level 6: Pusat
        User::updateOrCreate(['email' => 'pusat@genting.id'], [
            'name' => 'Admin Kemenkes Pusat',
            'password' => Hash::make('password'),
            'role_level' => 6,
            'provinsi_id' => null,
            'kabupaten_id' => null,
            'kecamatan_id' => null,
            'desa_id' => null,
        ]);

        // Level 7: Sysadmin
        User::updateOrCreate(['email' => 'sysadmin@genting.id'], [
            'name' => 'System Administrator',
            'password' => Hash::make('password'),
            'role_level' => 7,
            'provinsi_id' => null,
            'kabupaten_id' => null,
            'kecamatan_id' => null,
            'desa_id' => null,
        ]);

        // 3. Seed Dummy Balita & Antropometri untuk Desa Sokogrenjeng
        $balitaId1 = (string) \Illuminate\Support\Str::uuid();
        DB::table('m_balita')->insertOrIgnore([
            'balita_id' => $balitaId1,
            'nik_encrypted' => '1234567890123456',
            'nama_lengkap' => 'Ahmad Fulan',
            'tanggal_lahir' => '2023-01-15',
            'jenis_kelamin' => 'Laki-laki',
            'nama_ibu' => 'Siti Aminah',
            'alamat_lengkap' => 'Jl. Mawar No. 12, RT 01 RW 02, Sokogrenjeng',
            'kode_desa' => '3523012001',
            'posyandu_id' => '1',
            'created_at' => now(),
        ]);

        DB::table('t_antropometri')->insertOrIgnore([
            'antropometri_id' => (string) \Illuminate\Support\Str::uuid(),
            'balita_id' => $balitaId1,
            'tanggal_ukur' => '2024-05-10',
            'berat_badan' => 10.5,
            'tinggi_badan' => 80.0,
            'posisi_ukur' => 'Berdiri',
            'z_score' => -1.5,
            'z_score_hfa' => -1.2,
            'status_gizi' => 'Normal',
            'evaluasi' => 'Pertumbuhan baik, tingkatkan asupan protein.',
            'kader_id' => 2, // Asumsi User ID kader adalah 2
            'created_at' => now(),
        ]);

    }
}

