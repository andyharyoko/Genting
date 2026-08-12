<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class EnsureWilayahRLS
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();
        
        // For development/mocking purposes, we might not have full SSO yet, 
        // so we just check if user exists and has wilayah_id
        if ($user && isset($user->desa_id)) {
            // Set session variable untuk PostgreSQL RLS
            // Ini akan dibaca oleh kebijakan p_balita_wilayah_access
            DB::statement("SET app.current_wilayah_id = '{$user->desa_id}'");
            DB::statement("SET app.current_user_id = '{$user->id}'");
        }

        return $next($request);
    }
}
