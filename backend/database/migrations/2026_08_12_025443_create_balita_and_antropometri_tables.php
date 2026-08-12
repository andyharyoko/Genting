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
        Schema::create('m_balita', function (Blueprint $table) {
            $table->uuid('balita_id')->primary();
            $table->string('nik_encrypted')->nullable();
            $table->string('nama_lengkap');
            $table->date('tanggal_lahir');
            $table->string('jenis_kelamin');
            $table->string('nama_ibu');
            $table->text('alamat_lengkap')->nullable();
            $table->string('kode_desa')->nullable();
            $table->string('posyandu_id')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('t_antropometri', function (Blueprint $table) {
            $table->uuid('antropometri_id')->primary();
            $table->uuid('balita_id');
            $table->date('tanggal_ukur');
            $table->float('berat_badan');
            $table->float('tinggi_badan');
            $table->string('posisi_ukur')->default('Berdiri');
            $table->float('lingkar_kepala')->nullable();
            $table->float('z_score')->nullable();
            $table->string('status_gizi')->nullable();
            $table->text('evaluasi')->nullable();
            $table->unsignedBigInteger('kader_id')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('balita_id')
                  ->references('balita_id')
                  ->on('m_balita')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_antropometri');
        Schema::dropIfExists('m_balita');
    }
};
