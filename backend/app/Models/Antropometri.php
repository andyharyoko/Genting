<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Antropometri extends Model
{
    protected $table = 't_antropometri';
    protected $primaryKey = 'antropometri_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false; // We use created_at with default CURRENT_TIMESTAMP

    protected $fillable = [
        'antropometri_id',
        'balita_id',
        'tanggal_ukur',
        'berat_badan',
        'tinggi_badan',
        'posisi_ukur',
        'lingkar_kepala',
        'z_score',
        'z_score_hfa',
        'status_gizi',
        'evaluasi',
        'kader_id',
    ];

    public function balita()
    {
        return $this->belongsTo(Balita::class, 'balita_id', 'balita_id');
    }
}
