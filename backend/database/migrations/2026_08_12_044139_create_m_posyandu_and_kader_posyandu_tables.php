<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Master table Posyandu
        Schema::create('m_posyandu', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('desa_id')->nullable();
            $table->string('kecamatan_id')->nullable();
            $table->string('kabupaten_id')->nullable();
            $table->string('alamat')->nullable();
            $table->timestamps();
        });

        // Pivot: Kader bisa bertugas di banyak Posyandu
        Schema::create('kader_posyandu', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');   // kader
            $table->unsignedBigInteger('posyandu_id');
            $table->boolean('is_primary')->default(false); // posyandu utama
            $table->timestamps();

            $table->unique(['user_id', 'posyandu_id']); // hindari duplikat
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('posyandu_id')->references('id')->on('m_posyandu')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kader_posyandu');
        Schema::dropIfExists('m_posyandu');
    }
};
