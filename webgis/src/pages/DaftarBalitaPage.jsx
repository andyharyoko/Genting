import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function DaftarBalitaPage() {
    const navigate = useNavigate();
    const [balitaList, setBalitaList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBalita = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const response = await axios.get('/api/v1/balita', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBalitaList(response.data.data);
            } catch (error) {
                console.error('Error fetching balita list:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBalita();
    }, []);

    return (
        <div className="bg-background text-on-background font-body-md antialiased min-h-screen pb-24 relative overflow-x-hidden flex flex-col">
            <header className="bg-surface dark:bg-surface-dim border-b border-outline-variant dark:border-outline docked full-width top-0 sticky z-40 py-4 transition-colors duration-200">
                <div className="flex items-center gap-4 px-margin-mobile w-full">
                    <button onClick={() => navigate(-1)} className="material-symbols-outlined text-primary dark:text-inverse-primary hover:bg-surface-container-high p-2 rounded-full transition-colors">
                        arrow_back
                    </button>
                    <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-inverse-primary">
                        Daftar Balita
                    </h1>
                </div>
            </header>

            <main className="px-margin-mobile pt-stack-md flex-1 flex flex-col gap-stack-lg">
                <section className="flex flex-col gap-stack-md">
                    <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm flex flex-col">
                        {loading ? (
                            <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
                                <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                                Memuat data...
                            </div>
                        ) : balitaList.length === 0 ? (
                            <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-4xl text-outline">child_care</span>
                                Belum ada data balita.
                            </div>
                        ) : (
                            balitaList.map((balita) => (
                                <div key={balita.id} className="flex flex-col p-4 border-b border-outline-variant last:border-b-0 bg-surface hover:bg-surface-container-high transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-secondary-container text-on-secondary-container p-2 rounded-full flex items-center justify-center">
                                                <span className="material-symbols-outlined">face</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="font-title-md text-title-md text-on-surface font-semibold">{balita.nama}</p>
                                                <p className="font-body-sm text-body-sm text-on-surface-variant">{balita.id}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                            <span>{balita.tanggal_lahir} ({balita.umur})</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                                            <span className="material-symbols-outlined text-[16px]">{balita.jk === 'Laki-laki' ? 'male' : 'female'}</span>
                                            <span>{balita.jk}</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-on-surface-variant text-sm col-span-2">
                                            <span className="material-symbols-outlined text-[16px] mt-0.5">location_on</span>
                                            <span className="line-clamp-2">{balita.alamat || 'Alamat tidak tersedia'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
