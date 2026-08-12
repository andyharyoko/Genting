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
        Schema::create('m_puskesmas', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('kabupaten_id', 4)->nullable();
            $table->timestamps();

            // Note: Since 'm_kabupaten' uses string IDs, we use string for kabupaten_id.
            $table->foreign('kabupaten_id')->references('id')->on('m_kabupaten')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_puskesmas');
    }
};
