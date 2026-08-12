<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserController extends Controller
{
    public function kaderList(Request $request)
    {
        $user = auth()->user();
        
        $query = User::with('posyanduList')
            ->where('role_level', 1);

        // Bidan Desa only sees Kader in their Desa
        if ($user && $user->role_level == 2) {
            $query->where('desa_id', $user->desa_id);
        }
        // Puskesmas Admin sees Kader in their Puskesmas
        if ($user && $user->role_level == 3) {
            $query->where('puskesmas_id', $user->puskesmas_id);
        }
        // Kabupaten Admin sees Kader in their Kabupaten
        if ($user && $user->role_level == 4) {
            $query->where('kabupaten_id', $user->kabupaten_id);
        }

        $kaders = $query->orderBy('name')->get();

        $kaders->transform(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'email' => $item->email,
                'no_hp' => $item->no_hp,
                'posyandu_list' => $item->posyanduList->map(function($p) {
                    return ['id' => $p->id, 'nama' => $p->nama];
                })
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $kaders
        ]);
    }

    public function storeKader(Request $request)
    {
        $user = auth()->user();
        
        if ($user->role_level != 2 && $user->role_level != 3 && $user->role_level < 4) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'no_hp' => 'nullable|string',
            'posyandu_ids' => 'nullable|array', // Array of posyandu IDs
            'desa_id' => 'nullable|string',
            'puskesmas_id' => 'nullable|string'
        ]);

        $kaderData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_level' => 1,
            'no_hp' => $validated['no_hp'],
        ];

        // Assign region based on the Bidan, Puskesmas, or Kabupaten creating it
        if (in_array($user->role_level, [2, 3, 4])) {
            $kaderData['desa_id'] = $user->role_level == 2 ? $user->desa_id : ($validated['desa_id'] ?? null);
            $kaderData['kecamatan_id'] = $user->kecamatan_id;
            $kaderData['kabupaten_id'] = $user->kabupaten_id;
            $kaderData['provinsi_id'] = $user->provinsi_id;
            $kaderData['puskesmas_id'] = $user->role_level == 4 ? ($validated['puskesmas_id'] ?? null) : $user->puskesmas_id;
        }

        $kader = User::create($kaderData);

        if (!empty($validated['posyandu_ids'])) {
            $kader->posyanduList()->sync($validated['posyandu_ids']);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Kader berhasil ditambahkan'
        ], 201);
    }

    public function updateKader(Request $request, $id)
    {
        $user = auth()->user();
        $kader = User::findOrFail($id);

        if ($kader->role_level != 1) {
            return response()->json(['message' => 'Hanya bisa mengedit Kader'], 422);
        }

        if ($user->role_level == 2 && $kader->desa_id != $user->desa_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->role_level == 3 && $kader->puskesmas_id != $user->puskesmas_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        if ($user->role_level == 4 && $kader->kabupaten_id != $user->kabupaten_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$id,
            'password' => 'nullable|min:6',
            'no_hp' => 'nullable|string',
            'posyandu_ids' => 'nullable|array',
            'desa_id' => 'nullable|string'
        ]);

        $kader->name = $validated['name'];
        $kader->email = $validated['email'];
        $kader->no_hp = $validated['no_hp'] ?? $kader->no_hp;
        
        if (isset($validated['desa_id'])) {
            $kader->desa_id = $validated['desa_id'];
        }
        
        if (!empty($validated['password'])) {
            $kader->password = Hash::make($validated['password']);
        }
        
        $kader->save();

        if (isset($validated['posyandu_ids'])) {
            $kader->posyanduList()->sync($validated['posyandu_ids']);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Data Kader berhasil diperbarui'
        ]);
    }

    public function destroyKader($id)
    {
        $user = auth()->user();
        $kader = User::findOrFail($id);

        if ($kader->role_level != 1) {
            return response()->json(['message' => 'Hanya bisa menghapus Kader'], 422);
        }

        if ($user->role_level == 2 && $kader->desa_id != $user->desa_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->role_level == 3 && $kader->puskesmas_id != $user->puskesmas_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        if ($user->role_level == 4 && $kader->kabupaten_id != $user->kabupaten_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $kader->posyanduList()->detach();
        $kader->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Kader berhasil dihapus'
        ]);
    }

    // --- BIDAN CRUD (For Puskesmas Level 3) ---

    public function bidanList(Request $request)
    {
        $user = auth()->user();
        
        $query = User::with('desaList')->where('role_level', 2);

        // Puskesmas Admin sees Bidan in their Puskesmas
        if ($user && $user->role_level == 3) {
            $query->where('puskesmas_id', $user->puskesmas_id);
        }
        // Kabupaten Admin sees Bidan in their Kabupaten
        if ($user && $user->role_level == 4) {
            $query->where('kabupaten_id', $user->kabupaten_id);
        }

        $bidans = $query->orderBy('name')->get();

        $bidans->transform(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'email' => $item->email,
                'no_hp' => $item->no_hp,
                'desa_id' => $item->desa_id,
                'desa_list' => $item->desaList->map(function($d) {
                    return ['id' => $d->id, 'nama' => $d->nama];
                })
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $bidans
        ]);
    }

    public function storeBidan(Request $request)
    {
        $user = auth()->user();
        
        if ($user->role_level != 3 && $user->role_level < 4) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'no_hp' => 'nullable|string',
            'desa_ids' => 'required|array',
            'puskesmas_id' => 'nullable|string'
        ]);

        $bidanData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_level' => 2,
            'no_hp' => $validated['no_hp'],
            'desa_id' => count($validated['desa_ids']) > 0 ? $validated['desa_ids'][0] : null,
        ];

        // Assign region based on the Puskesmas Admin or Kabupaten Admin creating it
        if (in_array($user->role_level, [3, 4])) {
            $bidanData['puskesmas_id'] = $user->role_level == 4 ? ($validated['puskesmas_id'] ?? null) : $user->puskesmas_id;
            $bidanData['kecamatan_id'] = $user->kecamatan_id;
            $bidanData['kabupaten_id'] = $user->kabupaten_id;
            $bidanData['provinsi_id'] = $user->provinsi_id;
        }

        $bidan = User::create($bidanData);

        if (!empty($validated['desa_ids'])) {
            $bidan->desaList()->sync($validated['desa_ids']);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Bidan berhasil ditambahkan'
        ], 201);
    }

    public function updateBidan(Request $request, $id)
    {
        $user = auth()->user();
        $bidan = User::findOrFail($id);

        if ($bidan->role_level != 2) {
            return response()->json(['message' => 'Hanya bisa mengedit Bidan'], 422);
        }

        if ($user->role_level == 3 && $bidan->puskesmas_id != $user->puskesmas_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        if ($user->role_level == 4 && $bidan->kabupaten_id != $user->kabupaten_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$id,
            'password' => 'nullable|min:6',
            'no_hp' => 'nullable|string',
            'desa_ids' => 'required|array'
        ]);

        $bidan->name = $validated['name'];
        $bidan->email = $validated['email'];
        $bidan->no_hp = $validated['no_hp'] ?? $bidan->no_hp;
        $bidan->desa_id = count($validated['desa_ids']) > 0 ? $validated['desa_ids'][0] : null;
        
        if (!empty($validated['password'])) {
            $bidan->password = Hash::make($validated['password']);
        }
        
        $bidan->save();

        if (isset($validated['desa_ids'])) {
            $bidan->desaList()->sync($validated['desa_ids']);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Data Bidan berhasil diperbarui'
        ]);
    }

    public function destroyBidan($id)
    {
        $user = auth()->user();
        $bidan = User::findOrFail($id);

        if ($bidan->role_level != 2) {
            return response()->json(['message' => 'Hanya bisa menghapus Bidan'], 422);
        }

        if ($user->role_level == 3 && $bidan->puskesmas_id != $user->puskesmas_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        if ($user->role_level == 4 && $bidan->kabupaten_id != $user->kabupaten_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $bidan->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Bidan berhasil dihapus'
        ]);
    }

    // --- PUSKESMAS ADMIN CRUD (For Kabupaten Level 4) ---
    
    public function puskesmasAdminList(Request $request)
    {
        $user = auth()->user();
        
        $query = User::with('puskesmas:id,nama')->where('role_level', 3);

        if ($user && $user->role_level == 4) {
            $query->where('kabupaten_id', $user->kabupaten_id);
        }

        $admins = $query->orderBy('name')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'email' => $item->email,
                'no_hp' => $item->no_hp,
                'puskesmas_id' => $item->puskesmas_id,
                'puskesmas_nama' => $item->puskesmas ? $item->puskesmas->nama : null,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $admins
        ]);
    }

    public function storePuskesmasAdmin(Request $request)
    {
        $user = auth()->user();
        
        if ($user->role_level != 4 && $user->role_level < 5) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'no_hp' => 'nullable|string',
            'puskesmas_id' => 'required|string|exists:m_puskesmas,id'
        ]);

        $adminData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_level' => 3,
            'no_hp' => $validated['no_hp'],
            'puskesmas_id' => $validated['puskesmas_id'],
        ];

        // Assign region based on the Kabupaten Admin creating it
        if ($user->role_level == 4) {
            $adminData['kabupaten_id'] = $user->kabupaten_id;
            $adminData['provinsi_id'] = $user->provinsi_id;
            // Get kecamatan_id from m_puskesmas
            $puskesmas = \Illuminate\Support\Facades\DB::table('m_puskesmas')->where('id', $validated['puskesmas_id'])->first();
            if ($puskesmas) {
                $adminData['kecamatan_id'] = $puskesmas->kecamatan_id;
            }
        }

        User::create($adminData);

        return response()->json([
            'status' => 'success',
            'message' => 'Admin Puskesmas berhasil ditambahkan'
        ], 201);
    }

    public function updatePuskesmasAdmin(Request $request, $id)
    {
        $user = auth()->user();
        $admin = User::findOrFail($id);

        if ($admin->role_level != 3) {
            return response()->json(['message' => 'Hanya bisa mengedit Admin Puskesmas'], 422);
        }

        if ($user->role_level == 4 && $admin->kabupaten_id != $user->kabupaten_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$id,
            'password' => 'nullable|min:6',
            'no_hp' => 'nullable|string',
            'puskesmas_id' => 'required|string|exists:m_puskesmas,id'
        ]);

        $admin->name = $validated['name'];
        $admin->email = $validated['email'];
        $admin->no_hp = $validated['no_hp'] ?? $admin->no_hp;
        $admin->puskesmas_id = $validated['puskesmas_id'];
        
        if (!empty($validated['password'])) {
            $admin->password = Hash::make($validated['password']);
        }
        
        // Update kecamatan_id if puskesmas changed
        $puskesmas = \Illuminate\Support\Facades\DB::table('m_puskesmas')->where('id', $validated['puskesmas_id'])->first();
        if ($puskesmas) {
            $admin->kecamatan_id = $puskesmas->kecamatan_id;
        }
        
        $admin->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Data Admin Puskesmas berhasil diperbarui'
        ]);
    }

    public function destroyPuskesmasAdmin($id)
    {
        $user = auth()->user();
        $admin = User::findOrFail($id);

        if ($admin->role_level != 3) {
            return response()->json(['message' => 'Hanya bisa menghapus Admin Puskesmas'], 422);
        }

        if ($user->role_level == 4 && $admin->kabupaten_id != $user->kabupaten_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $admin->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Admin Puskesmas berhasil dihapus'
        ]);
    }
}
