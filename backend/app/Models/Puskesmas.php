<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Puskesmas extends Model
{
    use HasFactory;

    protected $table = 'm_puskesmas';

    protected $fillable = [
        'nama',
        'kabupaten_id',
    ];

    public function posyandu()
    {
        return $this->hasMany(Posyandu::class, 'puskesmas_id', 'id');
    }
}
