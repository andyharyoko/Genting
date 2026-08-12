<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Antropometri;
use App\Models\Balita;

class DashboardController extends Controller
{
    /**
     * Get Kader Dashboard Stats
     */
    public function kader(Request $request)
    {
        $user = $request->user();

        // 1. Get total pending (mock for now, usually handled offline on device)
        $pendingData = 0;

        // 2. Get recent activities (Aktivitas Terakhir)
        // Join antropometri with balita to get names
        $recentActivities = Antropometri::join('m_balita', 't_antropometri.balita_id', '=', 'm_balita.balita_id')
            ->select(
                't_antropometri.antropometri_id',
                'm_balita.nama_lengkap',
                't_antropometri.tanggal_ukur',
                't_antropometri.created_at',
                't_antropometri.status_gizi'
            )
            ->orderBy('t_antropometri.created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                // Determine action type mock based on status for UI variety
                $actionType = $item->status_gizi === 'Normal' ? 'Antropometri Rutin' : 'Pemantauan Khusus';
                $icon = $item->status_gizi === 'Normal' ? 'straighten' : 'warning';
                $colorClass = $item->status_gizi === 'Normal' ? 'bg-surface-container-high' : 'bg-error-container text-on-error-container';

                return [
                    'id' => $item->antropometri_id,
                    'nama' => $item->nama_lengkap,
                    'waktu' => \Carbon\Carbon::parse($item->created_at)->format('H:i') . ' WIB',
                    'tanggal' => \Carbon\Carbon::parse($item->created_at)->format('d M Y'),
                    'jenis_aksi' => $actionType,
                    'status' => 'Tersimpan',
                    'icon' => $icon,
                    'colorClass' => $colorClass
                ];
            });

        $puskesmasName = null;
        if ($user->puskesmas_id) {
            $puskesmas = DB::table('m_puskesmas')->where('id', $user->puskesmas_id)->first();
            if ($puskesmas) {
                $puskesmasName = $puskesmas->nama;
            }
        }

        $regionNames = [
            'desa' => DB::table('m_desa')->where('id', $user->desa_id)->value('nama'),
            'kecamatan' => DB::table('m_kecamatan')->where('id', $user->kecamatan_id)->value('nama'),
            'kabupaten' => DB::table('m_kabupaten')->where('id', $user->kabupaten_id)->value('nama'),
            'provinsi' => DB::table('m_provinsi')->where('id', $user->provinsi_id)->value('nama'),
        ];
        
        $desaList = [];
        if ($user->role_level == 2) {
            $user->load('desaList');
            $desaList = $user->desaList->map(function($d) {
                return ['id' => $d->id, 'nama' => $d->nama];
            })->toArray();
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'user' => [
                    'name' => $user->name,
                    'role_level' => $user->role_level,
                    'lokasi' => 'Kader Posyandu',
                    'puskesmas_nama' => $puskesmasName,
                    'region_names' => $regionNames,
                    'kabupaten_id' => $user->kabupaten_id,
                    'kecamatan_id' => $user->kecamatan_id,
                    'puskesmas_id' => $user->puskesmas_id,
                    'desa_id' => $user->desa_id,
                    'desa_list' => $desaList,
                ],
                'pending_sync' => $pendingData,
                'aktivitas_terakhir' => $recentActivities
            ]
        ]);
    }

    /**
     * Get GIS Analytics Dashboard Stats
     */
    public function gis(Request $request)
    {
        $user = $request->user();

        // Count total balita
        $totalBalita = Balita::count();

        // Get hotspots (Mocking Posyandu locations with Stunting cases)
        // Since m_posyandu geometry might be complex to parse if empty, we will return some mock actionable clusters
        // and hotspots based on the user's coverage (Level 4+).
        
        $actionableClusters = [
            [
                'id' => 1,
                'nama' => 'Desa Sukamaju',
                'kecamatan' => 'Kec. Cibatu',
                'status' => 'CRITICAL',
                'cases' => 12,
                'coords' => [-6.897, 112.062]
            ],
            [
                'id' => 2,
                'nama' => 'Desa Mekarsari',
                'kecamatan' => 'Kec. Tarogong',
                'status' => 'WARNING',
                'cases' => 8,
                'coords' => [-6.910, 112.080]
            ],
            [
                'id' => 3,
                'nama' => 'Desa Purbayani',
                'kecamatan' => 'Kec. Caringin',
                'status' => 'CRITICAL',
                'cases' => 15,
                'coords' => [-6.885, 112.040]
            ]
        ];

        return response()->json([
            'status' => 'success',
            'data' => [
                'user' => [
                    'name' => $user->name,
                    'role_level' => $user->role_level,
                ],
                'summary' => [
                    'total_balita' => $totalBalita,
                    'mbg_efficiency' => 92.4, // Mock
                    'active_hotspots' => count(array_filter($actionableClusters, fn($c) => $c['status'] === 'CRITICAL')),
                    'intervention_rate' => 85
                ],
                'actionable_clusters' => $actionableClusters
            ]
        ]);
    }
}
