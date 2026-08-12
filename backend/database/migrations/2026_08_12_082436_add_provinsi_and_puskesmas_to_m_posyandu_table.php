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
        Schema::table('m_posyandu', function (Blueprint $table) {
            $table->string('provinsi_id', 2)->nullable()->after('nama');
            $table->unsignedBigInteger('puskesmas_id')->nullable()->after('kabupaten_id');

            $table->foreign('provinsi_id')->references('id')->on('m_provinsi')->onDelete('cascade');
            $table->foreign('puskesmas_id')->references('id')->on('m_puskesmas')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_posyandu', function (Blueprint $table) {
            $table->dropForeign(['provinsi_id']);
            $table->dropForeign(['puskesmas_id']);
            $table->dropColumn(['provinsi_id', 'puskesmas_id']);
        });
    }
};
