<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Balita extends Model
{
    protected $table = 'm_balita';
    protected $primaryKey = 'balita_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false; // We use created_at with default CURRENT_TIMESTAMP

    protected $fillable = [
        'balita_id',
        'nik_encrypted',
        'nama_lengkap',
        'tanggal_lahir',
        'jenis_kelamin',
        'alamat',
        'kode_desa',
        'posyandu_id',
    ];

    public function antropometri()
    {
        return $this->hasMany(Antropometri::class, 'balita_id', 'balita_id');
    }
}
