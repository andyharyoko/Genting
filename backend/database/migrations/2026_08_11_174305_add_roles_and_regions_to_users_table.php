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
        Schema::table('users', function (Blueprint $table) {
            $table->tinyInteger('role_level')->default(1)->comment('0:OrangTua, 1:Kader, 2:Bidan, 3:Puskesmas, 4:Kabupaten, 5:Provinsi, 6:Pusat, 7:Sysadmin');
            $table->string('provinsi_id', 2)->nullable();
            $table->string('kabupaten_id', 4)->nullable();
            $table->string('kecamatan_id', 7)->nullable();
            $table->string('desa_id', 10)->nullable();

            $table->foreign('provinsi_id')->references('id')->on('m_provinsi')->nullOnDelete();
            $table->foreign('kabupaten_id')->references('id')->on('m_kabupaten')->nullOnDelete();
            $table->foreign('kecamatan_id')->references('id')->on('m_kecamatan')->nullOnDelete();
            $table->foreign('desa_id')->references('id')->on('m_desa')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['desa_id']);
            $table->dropForeign(['kecamatan_id']);
            $table->dropForeign(['kabupaten_id']);
            $table->dropForeign(['provinsi_id']);
            $table->dropColumn(['role_level', 'provinsi_id', 'kabupaten_id', 'kecamatan_id', 'desa_id']);
        });
    }
};

