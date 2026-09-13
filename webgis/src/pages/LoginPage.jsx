import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Adjust the URL if backend runs on a different port (e.g. 8000)
            const response = await axios.post('/api/v1/login', {
                email,
                password
            });

            if (response.data.success) {
                const { user, token } = response.data.data;
                
                // Store auth info
                localStorage.setItem('auth_token', token);
                localStorage.setItem('user', JSON.stringify(user));
                
                // Route based on role_level
                // 1: Kader, 2: Bidan, 3: Puskesmas, 4+: GIS Admin
                if (user.role_level === 0) {
                    navigate('/orangtua-dashboard');
                } else if (user.role_level === 2) {
                    navigate('/bidan-dashboard');
                } else if (user.role_level === 3) {
                    navigate('/puskesmas-dashboard');
                } else if (user.role_level === 4) {
                    navigate('/kabupaten-dashboard');
                } else if (user.role_level === 1) {
                    navigate('/dashboard'); // Web Dashboard for Kader
                } else {
                    navigate('/gis'); // WebGIS for Level 5+
                }
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Terjadi kesalahan. Pastikan backend server menyala.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                        G
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">GENTING Login</h1>
                    <p className="text-sm text-gray-600 mt-2">Masuk ke sistem monitoring stunting</p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="user@genting.id"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="********"
                            required
                        />
                    </div>
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Memproses...' : 'Masuk'}
                        </button>
                    </div>
                </form>
                
                <div className="mt-6 border-t pt-4 text-xs text-gray-500">
                    <p>Akun Demo:</p>
                    <ul className="list-disc pl-4 mt-1">
                        <li>Kader (Level 1): <b>kader@genting.id</b></li>
                        <li>Kabupaten (Level 4): <b>kabupaten@genting.id</b></li>
                        <li>Password: <b>password</b></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
