<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AntropometriController;
use App\Http\Middleware\EnsureWilayahRLS;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1')->group(function () {
    // For development, we'll disable auth:sanctum if it's not setup yet, but keep the EnsureWilayahRLS.
    // In production this would be: ->middleware(['auth:sanctum', EnsureWilayahRLS::class])
    Route::middleware([EnsureWilayahRLS::class])->group(function () {
        
        // Sync Balita Data
        Route::post('/sync/balita', [AntropometriController::class, 'syncBalita']);
        
        // Sync Antropometri Data
        Route::post('/sync/antropometri', [AntropometriController::class, 'sync']);
        
        // Master Data WHO reference
        Route::get('/who-ref', [AntropometriController::class, 'getWhoReference']);

        // Fetch Riwayat KMS
        Route::get('/balita/{nik}/riwayat', [AntropometriController::class, 'getRiwayat']);

        // Delete Antropometri Data
        Route::delete('/antropometri/{id}', [AntropometriController::class, 'destroy']);
        
        // Update Antropometri Data
        Route::put('/antropometri/{id}', [AntropometriController::class, 'update']);
    });
});
