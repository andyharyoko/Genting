<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Posyandu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    /**
     * Get current user profile with region info and posyandu list
     */
    public function show(Request $request)
    {
        $user = $request->user()->load('posyanduList');

        $desa      = DB::table('m_desa')->where('id', $user->desa_id)->first();
        $kecamatan = DB::table('m_kecamatan')->where('id', $user->kecamatan_id)->first();
        $kabupaten = DB::table('m_kabupaten')->where('id', $user->kabupaten_id)->first();
        $provinsi  = DB::table('m_provinsi')->where('id', $user->provinsi_id)->first();
        $puskesmas = DB::table('m_puskesmas')->where('id', $user->puskesmas_id)->first();

        $desaName = '-';
        if ($user->role_level == 2) {
            $user->load('desaList');
            if ($user->desaList->count() > 0) {
                $desaName = $user->desaList->pluck('nama')->implode(', ');
            } elseif ($desa) {
                $desaName = $desa->nama;
            }
        } elseif ($desa) {
            $desaName = $desa->nama;
        }

        $posyanduList = $user->posyanduList->map(fn($p) => [
            'id'         => $p->id,
            'nama'       => $p->nama,
            'alamat'     => $p->alamat,
            'is_primary' => (bool) $p->pivot->is_primary,
        ]);

        return response()->json([
            'status' => 'success',
            'data'   => [
                'id'            => $user->id,
                'name'          => $user->name,
                'email'         => $user->email,
                'no_hp'         => $user->no_hp,
                'role_level'    => $user->role_level,
                'provinsi_id'   => $user->provinsi_id,
                'kabupaten_id'  => $user->kabupaten_id,
                'kecamatan_id'  => $user->kecamatan_id,
                'desa_id'       => $user->desa_id,
                'puskesmas_id'  => $user->puskesmas_id,
                'region_info'   => [
                    'provinsi'  => $provinsi?->nama  ?? '-',
                    'kabupaten' => $kabupaten?->nama  ?? '-',
                    'kecamatan' => $kecamatan?->nama  ?? '-',
                    'desa'      => $desaName,
                    'puskesmas' => $puskesmas?->nama  ?? '-',
                ],
                'posyandu_list' => $posyanduList,
                'desa_list'     => $user->role_level == 2 && $user->relationLoaded('desaList') ? $user->desaList->map(fn($d) => [
                    'id'   => $d->id,
                    'nama' => $d->nama,
                ]) : [],
            ]
        ]);
    }

    /**
     * Update name, no_hp, password
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'                 => 'required|string|max:255',
            'no_hp'                => 'nullable|string|max:20',
            'password'             => 'nullable|string|min:8|confirmed',
            'puskesmas_id'         => 'nullable|integer',
        ]);

        $updateData = [
            'name'  => $validated['name'],
            'no_hp' => $validated['no_hp'] ?? null,
        ];

        if (isset($validated['puskesmas_id']) && $user->role_level == 3) {
            $updateData['puskesmas_id'] = $validated['puskesmas_id'];
        }

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        return response()->json([
            'status'  => 'success',
            'message' => 'Profil berhasil diperbarui.',
        ]);
    }

    /**
     * List all posyandu available in user's desa/kecamatan (for assignment dropdown)
     */
    public function availablePosyandu(Request $request)
    {
        $user = $request->user();

        $list = DB::table('m_posyandu')
            ->where('kecamatan_id', $user->kecamatan_id)
            ->orderBy('nama')
            ->get(['id', 'nama', 'alamat', 'desa_id']);

        return response()->json(['status' => 'success', 'data' => $list]);
    }

    /**
     * Assign kader to a posyandu
     */
    public function assignPosyandu(Request $request)
    {
        $user      = $request->user();
        $validated = $request->validate([
            'posyandu_id' => 'required|exists:m_posyandu,id',
            'is_primary'  => 'boolean',
        ]);

        $posyanduId = $validated['posyandu_id'];
        $isPrimary  = $validated['is_primary'] ?? false;

        // If setting as primary, unset all others first
        if ($isPrimary) {
            DB::table('kader_posyandu')
                ->where('user_id', $user->id)
                ->update(['is_primary' => false]);
        }

        // Upsert: insert or update pivot
        DB::table('kader_posyandu')->updateOrInsert(
            ['user_id' => $user->id, 'posyandu_id' => $posyanduId],
            ['is_primary' => $isPrimary, 'updated_at' => now(), 'created_at' => now()]
        );

        return response()->json(['status' => 'success', 'message' => 'Posyandu berhasil ditambahkan.']);
    }

    /**
     * Remove kader from a posyandu
     */
    public function removePosyandu(Request $request, $posyanduId)
    {
        $user = $request->user();

        DB::table('kader_posyandu')
            ->where('user_id', $user->id)
            ->where('posyandu_id', $posyanduId)
            ->delete();

        return response()->json(['status' => 'success', 'message' => 'Posyandu berhasil dihapus.']);
    }

    /**
     * Set a posyandu as primary
     */
    public function setPrimary(Request $request, $posyanduId)
    {
        $user = $request->user();

        // Unset all
        DB::table('kader_posyandu')
            ->where('user_id', $user->id)
            ->update(['is_primary' => false]);

        // Set chosen as primary
        DB::table('kader_posyandu')
            ->where('user_id', $user->id)
            ->where('posyandu_id', $posyanduId)
            ->update(['is_primary' => true]);

        return response()->json(['status' => 'success', 'message' => 'Posyandu utama diperbarui.']);
    }
}
