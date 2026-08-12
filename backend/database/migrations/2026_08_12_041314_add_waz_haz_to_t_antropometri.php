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
        Schema::table('t_antropometri', function (Blueprint $table) {
            $table->float('z_score_hfa')->nullable()->after('z_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_antropometri', function (Blueprint $table) {
            $table->dropColumn('z_score_hfa');
        });
    }
};
