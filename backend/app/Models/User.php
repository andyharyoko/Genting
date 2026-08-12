<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role_level', 'provinsi_id', 'kabupaten_id', 'kecamatan_id', 'desa_id', 'posyandu', 'no_hp'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function posyanduList()
    {
        return $this->belongsToMany(\App\Models\Posyandu::class, 'kader_posyandu', 'user_id', 'posyandu_id')
                    ->withPivot('is_primary')
                    ->withTimestamps();
    }

    public function desaList()
    {
        return $this->belongsToMany(\App\Models\Desa::class, 'bidan_desa', 'user_id', 'desa_id')
                    ->withTimestamps();
    }

    public function balitas()
    {
        return $this->belongsToMany(\App\Models\Balita::class, 'user_balita', 'user_id', 'balita_id', 'id', 'balita_id')
                    ->withPivot('hubungan')
                    ->withTimestamps();
    }
}
