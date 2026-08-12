<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Balita;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class BalitaController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        $query = Balita::select(
                'm_balita.balita_id', 'm_balita.nama_lengkap', 'm_balita.jenis_kelamin',
                'm_balita.tanggal_lahir', 'm_balita.alamat_lengkap', 'm_balita.nama_ibu',
                'm_balita.posyandu_id', 'm_posyandu.nama as posyandu_nama',
                'm_balita.kode_desa'
            )
            ->leftJoin('m_posyandu', DB::raw('CAST("m_balita"."posyandu_id" AS BIGINT)'), '=', 'm_posyandu.id')
            ->orderBy('m_balita.nama_lengkap');

        // Role-based filtering
        if ($user && $user->role_level == 1) {
            // Kader: Only balitas in their assigned posyandus
            $assignedPosyandus = $user->posyanduList()->pluck('m_posyandu.id')->toArray();
            $query->whereIn('m_balita.posyandu_id', $assignedPosyandus);
        } elseif ($user && $user->role_level == 2) {
            // Bidan Desa: Balitas in posyandus located in the Bidan's desa
            $query->where('m_posyandu.desa_id', $user->desa_id);
        } elseif ($user && $user->role_level == 3) {
            // Puskesmas Admin: Balitas in posyandus assigned to their puskesmas
            $query->where('m_posyandu.puskesmas_id', $user->puskesmas_id);
        } elseif ($user && $user->role_level == 4) {
            // Kabupaten Admin: Balitas in posyandus assigned to their kabupaten
            $query->where('m_posyandu.kabupaten_id', $user->kabupaten_id);
        }

        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where('m_balita.nama_lengkap', 'ilike', $search);
        }

        if ($request->filled('posyandu_id')) {
            $query->where('m_balita.posyandu_id', $request->posyandu_id);
        }

        $balitas = $query->get();

        $balitas->transform(function ($item) {
            $jk = ($item->jenis_kelamin == 1 || strtolower($item->jenis_kelamin) == 'l' || $item->jenis_kelamin === 'Laki-laki')
                ? 'Laki-laki' : 'Perempuan';
            $umurBulan = \Carbon\Carbon::parse($item->tanggal_lahir)->diffInMonths(\Carbon\Carbon::now());

            return [
                'id'            => $item->balita_id,
                'nama'          => $item->nama_lengkap,
                'jk'            => $jk,
                'tanggal_lahir' => $item->tanggal_lahir,
                'umur'          => $umurBulan . ' bulan',
                'alamat'        => $item->alamat_lengkap,
                'nama_ibu'      => $item->nama_ibu,
                'posyandu_id'   => $item->posyandu_id,
                'posyandu'      => $item->posyandu_nama ?? '-',
                'kode_desa'     => $item->kode_desa,
            ];
        });

        return response()->json(['status' => 'success', 'data' => $balitas]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if ($user && $user->role_level >= 4) {
            return response()->json(['message' => 'Role Anda tidak memiliki akses untuk menambah Balita'], 403);
        }

        $validated = $request->validate([
            'nik'           => 'nullable|string',
            'nama'          => 'required|string',
            'tanggal_lahir' => 'required|date',
            'jenis_kelamin' => 'required|string',
            'kode_desa'     => 'required|string',
            'alamat'        => 'nullable|string',
            'nama_ibu'      => 'nullable|string',
            'posyandu_id'   => 'nullable|exists:m_posyandu,id',
        ]);

        $jkStr = strtolower(substr($validated['jenis_kelamin'], 0, 1));
        $jk    = ($jkStr == 'l') ? 'Laki-laki' : 'Perempuan';

        $balitaId = !empty($validated['nik']) && Str::isUuid($validated['nik'])
            ? $validated['nik']
            : (string) Str::uuid();

        $balita = Balita::create([
            'balita_id'       => $balitaId,
            'nama_lengkap'    => $validated['nama'],
            'jenis_kelamin'   => $jk,
            'tanggal_lahir'   => $validated['tanggal_lahir'],
            'kode_desa'       => $validated['kode_desa'],
            'alamat_lengkap'  => $validated['alamat'] ?? null,
            'nama_ibu'        => $validated['nama_ibu'] ?? null,
            'nik_encrypted'   => !empty($validated['nik']) ? $validated['nik'] : null,
            'posyandu_id'     => !empty($validated['posyandu_id']) ? $validated['posyandu_id'] : null,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Data balita berhasil disimpan.',
            'data'    => ['balita_id' => $balita->balita_id, 'nama' => $balita->nama_lengkap]
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        if ($user && $user->role_level >= 4) {
            return response()->json(['message' => 'Role Anda tidak memiliki akses untuk mengubah Balita'], 403);
        }

        $balita = Balita::find($id);
        if (!$balita) {
            return response()->json(['status' => 'error', 'message' => 'Data tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'nama'          => 'required|string',
            'tanggal_lahir' => 'required|date',
            'jenis_kelamin' => 'required|string',
            'kode_desa'     => 'required|string',
            'alamat'        => 'nullable|string',
            'nama_ibu'      => 'nullable|string',
            'posyandu_id'   => 'nullable|exists:m_posyandu,id',
        ]);

        $jkStr = strtolower(substr($validated['jenis_kelamin'], 0, 1));
        $jk    = ($jkStr == 'l') ? 'Laki-laki' : 'Perempuan';

        $balita->update([
            'nama_lengkap'   => $validated['nama'],
            'jenis_kelamin'  => $jk,
            'tanggal_lahir'  => $validated['tanggal_lahir'],
            'kode_desa'      => $validated['kode_desa'],
            'alamat_lengkap' => $validated['alamat'] ?? null,
            'nama_ibu'       => $validated['nama_ibu'] ?? null,
            'posyandu_id'    => !empty($validated['posyandu_id']) ? $validated['posyandu_id'] : null,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Data balita berhasil diperbarui.',
            'data'    => ['balita_id' => $balita->balita_id, 'nama' => $balita->nama_lengkap]
        ]);
    }

    public function destroy($id)
    {
        $user = auth()->user();
        if ($user && $user->role_level >= 4) {
            return response()->json(['message' => 'Role Anda tidak memiliki akses untuk menghapus Balita'], 403);
        }

        $balita = Balita::find($id);
        if (!$balita) {
            return response()->json(['status' => 'error', 'message' => 'Data tidak ditemukan.'], 404);
        }

        // Hapus riwayat antropometri terlebih dahulu
        DB::table('t_antropometri')->where('balita_id', $id)->delete();

        $balita->delete();

        return response()->json(['status' => 'success', 'message' => 'Data balita berhasil dihapus.']);
    }
}
