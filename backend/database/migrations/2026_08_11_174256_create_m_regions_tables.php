<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('m_provinsi', function (Blueprint $table) {
            $table->string('id', 2)->primary();
            $table->string('nama');
            $table->timestamps();
        });

        Schema::create('m_kabupaten', function (Blueprint $table) {
            $table->string('id', 4)->primary();
            $table->string('provinsi_id', 2);
            $table->string('nama');
            $table->timestamps();
            
            $table->foreign('provinsi_id')->references('id')->on('m_provinsi')->onDelete('cascade');
        });

        Schema::create('m_kecamatan', function (Blueprint $table) {
            $table->string('id', 7)->primary();
            $table->string('kabupaten_id', 4);
            $table->string('nama');
            $table->timestamps();
            
            $table->foreign('kabupaten_id')->references('id')->on('m_kabupaten')->onDelete('cascade');
        });

        Schema::create('m_desa', function (Blueprint $table) {
            $table->string('id', 10)->primary();
            $table->string('kecamatan_id', 7);
            $table->string('nama');
            $table->timestamps();
            
            $table->foreign('kecamatan_id')->references('id')->on('m_kecamatan')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_desa');
        Schema::dropIfExists('m_kecamatan');
        Schema::dropIfExists('m_kabupaten');
        Schema::dropIfExists('m_provinsi');
    }
};
