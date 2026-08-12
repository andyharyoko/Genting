<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Posyandu extends Model
{
    protected $table = 'm_posyandu';

    protected $fillable = [
        'nama', 'desa_id', 'kecamatan_id', 'kabupaten_id', 'provinsi_id', 'puskesmas_id', 'alamat',
    ];

    public function kaders()
    {
        return $this->belongsToMany(User::class, 'kader_posyandu', 'posyandu_id', 'user_id')
                    ->withPivot('is_primary')
                    ->withTimestamps();
    }

    public function desa()
    {
        return $this->belongsTo(Desa::class, 'desa_id', 'id');
    }

    public function puskesmas()
    {
        return $this->belongsTo(Puskesmas::class, 'puskesmas_id', 'id');
    }
}
