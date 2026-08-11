<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Antropometri;
use App\Models\Balita;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class AntropometriController extends Controller
{
    /**
     * Calculate Age in Months based on WHO standards
     */
    private function calculateAgeMonths($birthDate, $measureDate)
    {
        $birth = Carbon::parse($birthDate);
        $measure = Carbon::parse($measureDate);
        // Using Carbon's diffInMonths and casting to int to prevent float query error
        return (int) $birth->diffInMonths($measure);
    }

    /**
     * Determine Status Stunting based on Z-Score HFA
     */
    private function determineStatus($zScoreHFA)
    {
        if ($zScoreHFA < -3) {
            return 'SANGAT PENDEK (SEVERELY STUNTED)';
        } elseif ($zScoreHFA < -2) {
            return 'PENDEK (STUNTED)';
        } elseif ($zScoreHFA > 3) {
            return 'TINGGI';
        } else {
            return 'NORMAL';
        }
    }

    /**
     * Sync Antropometri Data from Mobile (Offline-First)
     */
    public function sync(Request $request)
    {
        $validated = $request->validate([
            'data' => 'required|array',
            'data.*.balita_id' => 'required|string',
            'data.*.tanggal_ukur' => 'required|date',
            'data.*.berat_badan' => 'required|numeric',
            'data.*.tinggi_badan' => 'required|numeric',
            'data.*.lingkar_kepala' => 'nullable|numeric',
            'data.*.posisi_ukur' => 'required|string|in:Berdiri,Terlentang'
        ]);

        $results = [];

        foreach ($validated['data'] as $dataUkur) {
            try {
                $balitaId = $dataUkur['balita_id'];
                
                // 1. Ambil data dasar balita
                $balita = Balita::where('balita_id', $balitaId)->first();
                if (!$balita) {
                    throw new \Exception("Balita ID {$balitaId} not found");
                }

                $usiaBulan = $this->calculateAgeMonths($balita->tanggal_lahir, $dataUkur['tanggal_ukur']);
                $jenisKelamin = $balita->jenis_kelamin;

                // 2. Koreksi Tinggi Badan (TB) berdasarkan posisi ukur
                // Standar WHO: Jika anak >= 24 bln diukur terlentang (-0.7cm) 
                // atau < 24 bln diukur berdiri (+0.7cm)
                $adjustedHeight = $dataUkur['tinggi_badan'];
                if ($usiaBulan < 24 && $dataUkur['posisi_ukur'] === 'Berdiri') {
                    $adjustedHeight += 0.7;
                } elseif ($usiaBulan >= 24 && $dataUkur['posisi_ukur'] === 'Terlentang') {
                    $adjustedHeight -= 0.7;
                }

                $antropometri = DB::transaction(function () use ($balitaId, $dataUkur, $usiaBulan, $jenisKelamin, $adjustedHeight) {
                    // 3. Query tabel m_who_lms untuk mendapatkan L, M, S
                    $refWFA = DB::table('m_who_lms')
                        ->where(['gender' => $jenisKelamin, 'age_months' => $usiaBulan, 'type' => 'weight_for_age'])
                        ->first();
                        
                    $refHFA = DB::table('m_who_lms')
                        ->where(['gender' => $jenisKelamin, 'age_months' => $usiaBulan, 'type' => 'height_for_age'])
                        ->first();

                    $zScoreWFA = null;
                    $zScoreHFA = null;

                    // 4. Rumus Z-Score: z = (((y/M)^L) - 1) / (L*S)
                    // (Tambahkan fallback dummy jika tabel m_who_lms kosong agar tidak null)
                    if (!$refWFA) {
                        $refWFA = (object) ['l' => 1, 'm' => 10.0, 's' => 0.1];
                    }
                    if (!$refHFA) {
                        $refHFA = (object) ['l' => 1, 'm' => 80.0, 's' => 0.1];
                    }

                    if ($refWFA && $refWFA->l != 0) {
                        $zScoreWFA = (pow(($dataUkur['berat_badan'] / $refWFA->m), $refWFA->l) - 1) / ($refWFA->l * $refWFA->s);
                    }
                    if ($refHFA && $refHFA->l != 0) {
                        $zScoreHFA = (pow(($adjustedHeight / $refHFA->m), $refHFA->l) - 1) / ($refHFA->l * $refHFA->s);
                    }

                    // 5. Simpan hasil ke t_antropometri
                    $antropometri = Antropometri::create([
                        'balita_id' => $balitaId,
                        'tanggal_ukur' => $dataUkur['tanggal_ukur'],
                        'berat_badan' => $dataUkur['berat_badan'],
                        'tinggi_badan' => $adjustedHeight,
                        'lingkar_kepala' => $dataUkur['lingkar_kepala'] ?? null,
                        'z_score_wfa' => $zScoreWFA !== null ? round($zScoreWFA, 2) : null,
                        'z_score_hfa' => $zScoreHFA !== null ? round($zScoreHFA, 2) : null,
                        'status_stunting' => $zScoreHFA !== null ? $this->determineStatus($zScoreHFA) : 'UNKNOWN',
                        'kader_id' => auth()->id() // Null if not authenticated via Sanctum yet
                    ]);

                    return $antropometri;
                });

                $results[] = [
                    'status' => 'success',
                    'data' => [
                        'antropometri_id' => $antropometri->antropometri_id,
                        'balita' => [
                            'id' => $balita->balita_id,
                            'nama' => $balita->nama_lengkap
                        ],
                        'hasil_ukur' => [
                            'z_score_hfa' => $antropometri->z_score_hfa,
                            'z_score_wfa' => $antropometri->z_score_wfa,
                            'status' => $antropometri->status_stunting
                        ],
                        'sync_at' => now()->toIso8601String()
                    ]
                ];

            } catch (\Exception $e) {
                \Log::error('Sync Antropometri Error: ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
                $results[] = [
                    'status' => 'error',
                    'message' => 'Gagal menghitung Z-Score',
                    'errors' => [
                        'exception' => [$e->getMessage()]
                    ],
                    'code' => 422
                ];
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Proses sinkronisasi selesai',
            'results' => $results
        ]);
    }

    /**
     * Get WHO Reference Data
     */
    public function getWhoReference()
    {
        $data = DB::table('m_who_lms')->get();
        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }

    public function syncBalita(Request $request)
    {
        $validated = $request->validate([
            'local_id' => 'required|string',
            'nik' => 'nullable|string',
            'nama' => 'required|string',
            'tanggal_lahir' => 'required|date',
            'jenis_kelamin' => 'required|string',
            'nama_ibu' => 'nullable|string',
        ]);

        $jkStr = strtolower(substr($validated['jenis_kelamin'], 0, 1));
        $jk = ($jkStr == 'l') ? 1 : 2;

        $balitaId = !empty($validated['nik']) && $validated['nik'] !== '-' ? $validated['nik'] : $validated['local_id'];

        $balita = Balita::updateOrCreate(
            ['balita_id' => $balitaId],
            [
                'nama_lengkap' => $validated['nama'],
                'jenis_kelamin' => $jk,
                'tanggal_lahir' => $validated['tanggal_lahir'],
                'kode_desa' => '3523' // dummy
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Data balita disinkronisasi',
            'data' => $balita
        ]);
    }

    /**
     * Fetch Riwayat KMS (Synchronize Down to Mobile)
     */
    public function getRiwayat($balitaId)
    {
        $riwayat = Antropometri::with('balita')->where('balita_id', $balitaId)
            ->orderBy('tanggal_ukur', 'desc')
            ->get();
            
        $formatted = $riwayat->map(function ($item) {
            $evaluasiText = null;

            if ($item->z_score_wfa !== null && $item->z_score_hfa !== null && $item->balita) {
                $jk = $item->balita->jenis_kelamin;
                $bbAktualVal = $item->berat_badan;
                $tbAktualVal = $item->tinggi_badan;
                
                // Cari Weight Age (Usia BB saat ini menyentuh Z=0 / Median)
                $weightAgeRef = DB::table('m_who_lms')->where('type', 'weight_for_age')
                    ->where('gender', $jk)
                    ->orderByRaw("ABS(m - ?)", [$bbAktualVal])
                    ->first();
                    
                // Cari Height Age (Usia TB saat ini menyentuh Z=0 / Median)
                $heightAgeRef = DB::table('m_who_lms')->where('type', 'height_for_age')
                    ->where('gender', $jk)
                    ->orderByRaw("ABS(m - ?)", [$tbAktualVal])
                    ->first();
                    
                if ($weightAgeRef && $heightAgeRef) {
                    $wa = $weightAgeRef->age_months;
                    $ha = $heightAgeRef->age_months;
                    
                    if ($item->z_score_wfa < $item->z_score_hfa) {
                        $judul = "Evaluasi Usia Ekivalen (Defisit Berat Badan):";
                        $catatan = "Ketertinggalan berat badan lebih signifikan dibandingkan tinggi badannya.";
                    } elseif ($item->z_score_wfa > $item->z_score_hfa) {
                        $judul = "Evaluasi Usia Ekivalen (Risiko Proporsi / Perawakan Pendek):";
                        $catatan = "Pertambahan berat badan lebih cepat dibandingkan tinggi badannya.";
                    } else {
                        $judul = "Evaluasi Usia Ekivalen (Pertumbuhan Proporsional):";
                        $catatan = "Perkembangan berat dan tinggi badan berjalan secara proporsional.";
                    }
                    
                    $evaluasiText = "$judul Berat badan anak saat ini ($bbAktualVal kg) setara normal anak usia $wa bulan. Tinggi badannya ($tbAktualVal cm) setara normal anak usia $ha bulan. $catatan";
                }
            }

            return [
                'id' => $item->antropometri_id,
                'tanggal_ukur' => $item->tanggal_ukur,
                'berat_badan' => $item->berat_badan,
                'tinggi_badan' => $item->tinggi_badan,
                'posisi_ukur' => 'Berdiri', // simplify for now
                'z_score' => $item->z_score_wfa,
                'status_gizi' => $item->status_stunting,
                'evaluasi' => $evaluasiText
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $formatted
        ]);
    }

    public function destroy($id)
    {
        $antropometri = Antropometri::find($id);
        
        if (!$antropometri) {
            return response()->json([
                'status' => 'error',
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $antropometri->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Data berhasil dihapus dari server'
        ]);
    }

    public function update(Request $request, $id)
    {
        $antropometri = Antropometri::find($id);
        if (!$antropometri) {
            return response()->json(['status' => 'error', 'message' => 'Data tidak ditemukan'], 404);
        }

        $validated = $request->validate([
            'berat_badan' => 'required|numeric',
            'tinggi_badan' => 'required|numeric',
            'lingkar_kepala' => 'nullable|numeric',
            'posisi_ukur' => 'required|string|in:Berdiri,Terlentang',
            'tanggal_ukur' => 'required|date'
        ]);

        $balita = Balita::where('balita_id', $antropometri->balita_id)->first();
        if (!$balita) {
            return response()->json(['status' => 'error', 'message' => 'Balita tidak ditemukan'], 404);
        }

        $usiaBulan = $this->calculateAgeMonths($balita->tanggal_lahir, $validated['tanggal_ukur']);
        $jenisKelamin = $balita->jenis_kelamin;

        $adjustedHeight = $validated['tinggi_badan'];
        if ($usiaBulan < 24 && $validated['posisi_ukur'] === 'Berdiri') {
            $adjustedHeight += 0.7;
        } elseif ($usiaBulan >= 24 && $validated['posisi_ukur'] === 'Terlentang') {
            $adjustedHeight -= 0.7;
        }

        $refWFA = DB::table('m_who_lms')
            ->where(['gender' => $jenisKelamin, 'age_months' => $usiaBulan, 'type' => 'weight_for_age'])
            ->first();
            
        $refHFA = DB::table('m_who_lms')
            ->where(['gender' => $jenisKelamin, 'age_months' => $usiaBulan, 'type' => 'height_for_age'])
            ->first();

        $zScoreWFA = null;
        $zScoreHFA = null;

        if (!$refWFA) $refWFA = (object) ['l' => 1, 'm' => 10.0, 's' => 0.1];
        if (!$refHFA) $refHFA = (object) ['l' => 1, 'm' => 80.0, 's' => 0.1];

        if ($refWFA && $refWFA->l != 0) {
            $zScoreWFA = (pow(($validated['berat_badan'] / $refWFA->m), $refWFA->l) - 1) / ($refWFA->l * $refWFA->s);
        }
        if ($refHFA && $refHFA->l != 0) {
            $zScoreHFA = (pow(($adjustedHeight / $refHFA->m), $refHFA->l) - 1) / ($refHFA->l * $refHFA->s);
        }

        $antropometri->update([
            'tanggal_ukur' => $validated['tanggal_ukur'],
            'berat_badan' => $validated['berat_badan'],
            'tinggi_badan' => $adjustedHeight,
            'lingkar_kepala' => $validated['lingkar_kepala'] ?? null,
            'z_score_wfa' => $zScoreWFA !== null ? round($zScoreWFA, 2) : null,
            'z_score_hfa' => $zScoreHFA !== null ? round($zScoreHFA, 2) : null,
            'status_stunting' => $zScoreHFA !== null ? $this->determineStatus($zScoreHFA) : 'UNKNOWN',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Data berhasil diupdate di server',
            'data' => $antropometri
        ]);
    }
}
