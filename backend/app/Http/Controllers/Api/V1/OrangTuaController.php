<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Balita;
use App\Models\User;

class OrangTuaController extends Controller
{
    /**
     * Get all Balita linked to the authenticated Orang Tua (Parent)
     */
    public function getLinkedBalita(Request $request)
    {
        $user = auth()->user();

        if ($user->role_level != 0) {
            return response()->json(['message' => 'Hanya Orang Tua yang dapat mengakses data ini.'], 403);
        }

        $balitas = $user->balitas()->with(['antropometri' => function ($query) {
            $query->orderBy('tanggal_ukur', 'desc');
        }])->get();

        return response()->json([
            'status' => 'success',
            'data' => $balitas
        ]);
    }

    /**
     * Link a Balita to the Orang Tua account by verifying Nama Anak, Tanggal Lahir, and Nama Ibu
     */
    public function linkBalita(Request $request)
    {
        $user = auth()->user();

        if ($user->role_level != 0) {
            return response()->json(['message' => 'Hanya Orang Tua yang dapat menautkan data Balita.'], 403);
        }

        $validated = $request->validate([
            'nama_anak' => 'required|string',
            'tanggal_lahir' => 'required|date',
            'nama_ibu' => 'required|string',
        ]);

        // Find Balita that matches the criteria
        // We use lower case and trim to ensure fuzzy matches are somewhat supported,
        // but for exact matches we'll just use a strict where but ignore case if possible.
        // In PostgreSQL, ILIKE can be used for case-insensitive matching.
        $balita = Balita::where('tanggal_lahir', $validated['tanggal_lahir'])
            ->whereRaw('LOWER(nama_lengkap) LIKE ?', ['%' . strtolower(trim($validated['nama_anak'])) . '%'])
            ->whereRaw('LOWER(nama_ibu) LIKE ?', ['%' . strtolower(trim($validated['nama_ibu'])) . '%'])
            ->first();

        if (!$balita) {
            return response()->json([
                'status' => 'error',
                'message' => 'Data Balita tidak ditemukan. Pastikan Nama Anak, Tanggal Lahir, dan Nama Ibu sesuai dengan data di Posyandu.'
            ], 404);
        }

        // Check if already linked
        if ($user->balitas()->where('m_balita.balita_id', $balita->balita_id)->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Data Balita ini sudah ditautkan ke akun Anda.'
            ], 400);
        }

        // Link the Balita
        $user->balitas()->attach($balita->balita_id, ['hubungan' => 'Orang Tua']);

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil menautkan data Balita.',
            'data' => $balita
        ]);
    }
}
