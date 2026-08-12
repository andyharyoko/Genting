<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Posyandu;

class PosyanduController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        
        $query = Posyandu::query();

        // Bidan Desa sees Posyandu in all their assigned Desas
        if ($user && $user->role_level == 2) {
            $user->load('desaList');
            $desaIds = $user->desaList->pluck('id')->toArray();
            if (!in_array($user->desa_id, $desaIds) && $user->desa_id) {
                $desaIds[] = $user->desa_id;
            }
            $query->whereIn('desa_id', $desaIds);
        }
        
        // Puskesmas Admin sees Posyandu in their Puskesmas
        if ($user && $user->role_level == 3) {
            $query->where('puskesmas_id', $user->puskesmas_id);
        }
        
        // Kabupaten Admin sees Posyandu in their Kabupaten
        if ($user && $user->role_level == 4) {
            $query->where('kabupaten_id', $user->kabupaten_id);
        }

        $posyandus = $query->with(['puskesmas:id,nama', 'desa:id,nama'])->orderBy('nama')->get()->map(function($posyandu) {
            $data = $posyandu->toArray();
            $data['puskesmas_nama'] = $posyandu->puskesmas ? $posyandu->puskesmas->nama : null;
            $data['desa_nama'] = $posyandu->desa ? $posyandu->desa->nama : null;
            unset($data['puskesmas']);
            unset($data['desa']);
            return $data;
        });

        return response()->json([
            'status' => 'success',
            'data' => $posyandus
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        
        if ($user->role_level != 2 && $user->role_level != 3 && $user->role_level < 4) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'alamat' => 'nullable|string',
            'puskesmas_id' => 'nullable|exists:m_puskesmas,id',
            'provinsi_id' => 'nullable|string|max:2',
            'desa_id' => 'nullable|string|max:20',
        ]);

        // Default to Bidan's region if they are creating it
        if ($user->role_level == 2) {
            $user->load('desaList');
            $validDesaIds = $user->desaList->pluck('id')->toArray();
            if ($user->desa_id && !in_array($user->desa_id, $validDesaIds)) {
                $validDesaIds[] = $user->desa_id;
            }
            
            if (empty($validated['desa_id']) || !in_array($validated['desa_id'], $validDesaIds)) {
                return response()->json(['message' => 'Desa tidak valid atau bukan wilayah Anda'], 403);
            }
            
            $validated['provinsi_id'] = $user->provinsi_id;
            $validated['kecamatan_id'] = $user->kecamatan_id;
            $validated['kabupaten_id'] = $user->kabupaten_id;
            $validated['puskesmas_id'] = $user->puskesmas_id;
        }

        // Default to Puskesmas Admin's region
        if ($user->role_level == 3) {
            $validated['puskesmas_id'] = $user->puskesmas_id;
            $validated['provinsi_id'] = $user->provinsi_id;
            $validated['kecamatan_id'] = $user->kecamatan_id;
            $validated['kabupaten_id'] = $user->kabupaten_id;
        }

        // Default to Kabupaten Admin's region
        if ($user->role_level == 4) {
            $validated['provinsi_id'] = $user->provinsi_id;
            $validated['kabupaten_id'] = $user->kabupaten_id;
            // puskesmas_id, kecamatan_id, desa_id should be provided in request
        }

        $posyandu = Posyandu::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Posyandu berhasil ditambahkan',
            'data' => $posyandu
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        $posyandu = Posyandu::findOrFail($id);

        if ($user->role_level == 2 && $posyandu->desa_id != $user->desa_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->role_level == 3 && $posyandu->puskesmas_id != $user->puskesmas_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->role_level == 4 && $posyandu->kabupaten_id != $user->kabupaten_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'alamat' => 'nullable|string',
            'puskesmas_id' => 'nullable|exists:m_puskesmas,id',
            'provinsi_id' => 'nullable|string|max:2',
            'desa_id' => 'nullable|string|max:20',
        ]);

        $posyandu->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Posyandu berhasil diperbarui',
            'data' => $posyandu
        ]);
    }

    public function destroy($id)
    {
        $user = auth()->user();
        $posyandu = Posyandu::findOrFail($id);

        if ($user->role_level == 2) {
            $user->load('desaList');
            $validDesaIds = $user->desaList->pluck('id')->toArray();
            if ($user->desa_id && !in_array($user->desa_id, $validDesaIds)) {
                $validDesaIds[] = $user->desa_id;
            }
            if (!in_array($posyandu->desa_id, $validDesaIds)) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        if ($user->role_level == 3 && $posyandu->puskesmas_id != $user->puskesmas_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        if ($user->role_level == 4 && $posyandu->kabupaten_id != $user->kabupaten_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $posyandu->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Posyandu berhasil dihapus'
        ]);
    }
}
