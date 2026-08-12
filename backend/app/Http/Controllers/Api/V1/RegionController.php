<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RegionController extends Controller
{
    public function getProvinsi()
    {
        $data = DB::table('m_provinsi')->select('id', 'nama')->orderBy('nama')->get();
        return response()->json(['status' => 'success', 'data' => $data]);
    }

    public function getKabupaten($prov_id)
    {
        $data = DB::table('m_kabupaten')
            ->where('provinsi_id', $prov_id)
            ->select('id', 'nama')
            ->orderBy('nama')
            ->get();
        return response()->json(['status' => 'success', 'data' => $data]);
    }

    public function getKecamatan($kab_id)
    {
        $data = DB::table('m_kecamatan')
            ->where('kabupaten_id', $kab_id)
            ->select('id', 'nama')
            ->orderBy('nama')
            ->get();
        return response()->json(['status' => 'success', 'data' => $data]);
    }

    public function getDesa($kec_id)
    {
        $data = DB::table('m_desa')
            ->where('kecamatan_id', $kec_id)
            ->select('id', 'nama')
            ->orderBy('nama')
            ->get();
        return response()->json(['status' => 'success', 'data' => $data]);
    }

    public function getPuskesmas($kab_id)
    {
        $data = DB::table('m_puskesmas')
            ->where('kabupaten_id', $kab_id)
            ->select('id', 'nama')
            ->orderBy('nama')
            ->get();
        return response()->json(['status' => 'success', 'data' => $data]);
    }
}
