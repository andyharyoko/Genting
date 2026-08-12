<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Desa extends Model
{
    protected $table = 'm_desa';
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = ['id', 'kecamatan_id', 'nama'];
}
