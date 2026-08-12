<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AntropometriController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\RegionController;
use App\Http\Controllers\Api\V1\BalitaController;
use App\Http\Controllers\Api\V1\PosyanduController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Middleware\EnsureWilayahRLS;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1')->group(function () {
    
    // Auth Routes
    Route::post('/login', [AuthController::class, 'login']);

    // Protected Routes
    Route::middleware(['auth:sanctum', EnsureWilayahRLS::class])->group(function () {
        
        Route::post('/logout', [AuthController::class, 'logout']);

        // Dashboard Routes
        Route::get('/dashboard/kader', [DashboardController::class, 'kader']);
        Route::get('/dashboard/gis', [DashboardController::class, 'gis']);

        // Sync Balita Data
        Route::post('/sync/balita', [AntropometriController::class, 'syncBalita']);
        
        // Sync Antropometri Data
        Route::post('/sync/antropometri', [AntropometriController::class, 'sync']);

        // Balita Web Operations
        Route::get('/balita', [BalitaController::class, 'index']);
        Route::post('/balita', [BalitaController::class, 'store']);
        Route::put('/balita/{id}', [BalitaController::class, 'update']);
        Route::delete('/balita/{id}', [BalitaController::class, 'destroy']);
        
        // Regions for Dropdowns
        Route::get('/regions/provinsi', [RegionController::class, 'getProvinsi']);
        Route::get('/regions/kabupaten/{prov_id}', [RegionController::class, 'getKabupaten']);
        Route::get('/regions/kecamatan/{kab_id}', [RegionController::class, 'getKecamatan']);
        Route::get('/regions/desa/{kec_id}', [RegionController::class, 'getDesa']);
        Route::get('/regions/puskesmas/{kab_id}', [RegionController::class, 'getPuskesmas']);
        
        // Master Data WHO reference
        Route::get('/who-ref', [AntropometriController::class, 'getWhoReference']);

        // Fetch Riwayat KMS
        Route::get('/balita/{nik}/riwayat', [AntropometriController::class, 'getRiwayat']);

        // Delete Antropometri Data
        Route::delete('/antropometri/{id}', [AntropometriController::class, 'destroy']);
        
        // Update Antropometri Data
        // Update Antropometri Data
        Route::put('/antropometri/{id}', [AntropometriController::class, 'update']);

        // Posyandu Management
        Route::get('/posyandu', [PosyanduController::class, 'index']);
        Route::post('/posyandu', [PosyanduController::class, 'store']);
        Route::put('/posyandu/{id}', [PosyanduController::class, 'update']);
        Route::delete('/posyandu/{id}', [PosyanduController::class, 'destroy']);

        // Kader Management
        Route::get('/kader', [UserController::class, 'kaderList']);
        Route::post('/kader', [UserController::class, 'storeKader']);
        Route::put('/kader/{id}', [UserController::class, 'updateKader']);
        Route::delete('/kader/{id}', [UserController::class, 'destroyKader']);

        // Bidan Management
        Route::get('/bidan', [UserController::class, 'bidanList']);
        Route::post('/bidan', [UserController::class, 'storeBidan']);
        Route::put('/bidan/{id}', [UserController::class, 'updateBidan']);
        Route::delete('/bidan/{id}', [UserController::class, 'destroyBidan']);
        
        // Puskesmas Admin Management
        Route::get('/admin-puskesmas', [UserController::class, 'puskesmasAdminList']);
        Route::post('/admin-puskesmas', [UserController::class, 'storePuskesmasAdmin']);
        Route::put('/admin-puskesmas/{id}', [UserController::class, 'updatePuskesmasAdmin']);
        Route::delete('/admin-puskesmas/{id}', [UserController::class, 'destroyPuskesmasAdmin']);

        // Profile Routes
        Route::get('/profile', [\App\Http\Controllers\Api\V1\ProfileController::class, 'show']);
        Route::put('/profile', [\App\Http\Controllers\Api\V1\ProfileController::class, 'update']);
        Route::get('/profile/posyandu/available', [\App\Http\Controllers\Api\V1\ProfileController::class, 'availablePosyandu']);
        Route::post('/profile/posyandu/assign', [\App\Http\Controllers\Api\V1\ProfileController::class, 'assignPosyandu']);
        Route::delete('/profile/posyandu/{posyandu_id}', [\App\Http\Controllers\Api\V1\ProfileController::class, 'removePosyandu']);
        Route::patch('/profile/posyandu/{posyandu_id}/primary', [\App\Http\Controllers\Api\V1\ProfileController::class, 'setPrimary']);
    });
});
