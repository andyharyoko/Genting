import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AddBalitaModal from '../components/AddBalitaModal';
import UkurBalitaModal from '../components/UkurBalitaModal';
import RiwayatBalitaModal from '../components/RiwayatBalitaModal';

export default function KaderDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState({ user: {}, pending_sync: 0, aktivitas_terakhir: [] });
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUkurModalOpen, setIsUkurModalOpen] = useState(false);
    const [selectedBalitaForUkur, setSelectedBalitaForUkur] = useState(null);
    const [isRiwayatModalOpen, setIsRiwayatModalOpen] = useState(false);
    const [selectedBalitaForRiwayat, setSelectedBalitaForRiwayat] = useState(null);
    const [selectedMeasurementForEdit, setSelectedMeasurementForEdit] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [balitaList, setBalitaList] = useState([]);
    const [activeTab, setActiveTab] = useState('aktivitas');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPosyandu, setFilterPosyandu] = useState('');
    const [posyanduFilter, setPosyanduFilter] = useState([]); // for filter dropdown
    const [editBalitaData, setEditBalitaData] = useState(null); // for editing balita

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            
            const [dashRes, balitaRes, profileRes] = await Promise.all([
                axios.get('http://localhost:8000/api/v1/dashboard/kader', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:8000/api/v1/balita', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:8000/api/v1/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            
            setData(dashRes.data.data);
            setBalitaList(balitaRes.data.data);
            setPosyanduFilter(profileRes.data.data?.posyandu_list || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleDeleteBalita = async (balita) => {
        if (!window.confirm(`Hapus data ${balita.nama}? Semua riwayat pengukuran juga akan terhapus.`)) return;
        try {
            const token = localStorage.getItem('auth_token');
            await axios.delete(`http://localhost:8000/api/v1/balita/${balita.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menghapus data.');
        }
    };

    return (
        <div className="bg-background text-on-background font-body-md antialiased flex h-screen overflow-hidden">
            
            {/* --- DESKTOP SIDEBAR NAVBAR --- */}
            <aside className="w-64 bg-surface border-r border-outline-variant/30 hidden md:flex flex-col z-40 shadow-sm">
                <div className="p-6 border-b border-outline-variant/30 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mx-auto mb-3 shadow-inner border border-outline-variant/30 text-2xl font-bold">
                        {data.user.name ? data.user.name.charAt(0).toUpperCase() : 'K'}
                    </div>
                    <h2 className="font-headline-md text-primary font-bold">{data.user.name || "Kader"}</h2>
                    <p className="font-body-md text-on-surface-variant text-sm">Kader Posyandu</p>
                    <p className="text-xs text-on-surface-variant mt-1 font-bold">{data.user.lokasi || 'Posyandu'}</p>
                </div>
                <nav className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto">
                    <button 
                        onClick={() => setActiveTab('aktivitas')} 
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'aktivitas' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-surface-container'}`}
                    >
                        <span className="material-symbols-outlined">dashboard</span> Aktivitas Terakhir
                    </button>
                    <button 
                        onClick={() => setActiveTab('anak')} 
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'anak' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-surface-container'}`}
                    >
                        <span className="material-symbols-outlined">child_care</span> Data Balita
                    </button>
                </nav>
                <div className="p-4 border-t border-outline-variant/30 flex flex-col gap-2">
                    <button onClick={() => navigate('/profil')} className="flex items-center gap-3 px-4 py-3 w-full text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors font-bold">
                        <span className="material-symbols-outlined">manage_accounts</span> Pengaturan Profil
                    </button>
                    <button onClick={handleLogout} className="flex items-center justify-center gap-3 px-4 py-3 w-full text-error hover:bg-error-container rounded-xl transition-colors font-bold">
                        <span className="material-symbols-outlined">logout</span> Keluar
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                
                {/* --- MOBILE HEADER --- */}
                <header className="md:hidden bg-surface/90 backdrop-blur-md border-b border-outline-variant/50 sticky top-0 z-40 py-4 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsDrawerOpen(true)} className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full">
                            menu
                        </button>
                        <h1 className="font-headline-md font-bold text-primary">Kader Dashboard</h1>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                        {data.user.name ? data.user.name.charAt(0).toUpperCase() : 'K'}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in-up bg-background">
                    
                    {/* Header Desktop - Welcome text */}
                    <section className="flex flex-col gap-1 mb-6">
                        <h2 className="font-headline-lg-mobile text-on-surface">
                            {activeTab === 'anak' ? 'Data Anak (KMS)' : 'Aktivitas Terakhir'}
                        </h2>
                        <p className="font-body-md text-on-surface-variant flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">health_and_safety</span>
                            Wilayah Kewenangan Kader
                        </p>
                    </section>

                    {/* Pending Sync Card (if applicable) */}
                    {data.pending_sync > 0 && (
                        <section className="mb-6">
                            <div className="bg-surface-container-low border-2 border-primary/20 rounded-2xl p-4 flex flex-col gap-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
                                <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110">
                                    <span className="material-symbols-outlined text-[120px]">sync</span>
                                </div>
                                <div className="flex items-start gap-4 relative z-10">
                                    <div className="bg-primary text-on-primary p-3 rounded-xl flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined">sync_problem</span>
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1">
                                        <h3 className="font-headline-md text-on-surface">{data.pending_sync} Data Tertunda</h3>
                                        <p className="font-body-md text-on-surface-variant">Menunggu koneksi internet untuk sinkronisasi ke server pusat.</p>
                                    </div>
                                </div>
                                <button className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm">
                                    <span className="material-symbols-outlined">sync</span> Sinkronkan Sekarang
                                </button>
                            </div>
                        </section>
                    )}

                    {/* Quick Actions */}
                    {activeTab === 'aktivitas' && (
                        <section className="mb-6 flex overflow-x-auto gap-3 pb-2 hide-scrollbar snap-x">
                            <button onClick={() => setIsAddModalOpen(true)} className="snap-start flex-shrink-0 bg-surface border border-outline-variant rounded-xl p-3 flex items-center gap-3 hover:bg-surface-container-high transition-all active:scale-95 shadow-sm min-w-[150px]">
                                <div className="bg-tertiary-container text-on-tertiary-container p-2 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                                </div>
                                <span className="font-bold text-sm text-on-surface">Tambah Balita</span>
                            </button>
                            <button className="snap-start flex-shrink-0 bg-surface border border-outline-variant rounded-xl p-3 flex items-center gap-3 hover:bg-surface-container-high transition-all active:scale-95 shadow-sm min-w-[150px]">
                                <div className="bg-secondary-container text-on-secondary-container p-2 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>child_care</span>
                                </div>
                                <span className="font-bold text-sm text-on-surface">Ukur Balita</span>
                            </button>
                            <button className="snap-start flex-shrink-0 bg-surface border border-outline-variant rounded-xl p-3 flex items-center gap-3 hover:bg-surface-container-high transition-all active:scale-95 shadow-sm min-w-[150px]">
                                <div className="bg-primary-container text-on-primary-container p-2 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
                                </div>
                                <span className="font-bold text-sm text-on-surface">Dompet Gizi</span>
                            </button>
                        </section>
                    )}

                    <section className="flex flex-col gap-stack-md">
                        {/* --- TAB AKTIVITAS --- */}
                        {activeTab === 'aktivitas' && (
                            <div className="bg-surface rounded-2xl border border-outline-variant/50 overflow-hidden shadow-sm flex flex-col">
                                <div className="px-5 py-4 bg-surface-container-lowest border-b border-outline-variant/30">
                                    <h3 className="font-title-md font-bold text-on-surface">Riwayat Aktivitas</h3>
                                </div>
                                {loading ? (
                                    <div className="p-8 text-center text-on-surface-variant animate-pulse">Memuat data...</div>
                                ) : data.aktivitas_terakhir.length === 0 ? (
                                    <div className="p-8 text-center text-on-surface-variant">Belum ada aktivitas.</div>
                                ) : (
                                    data.aktivitas_terakhir.map((act) => (
                                        <div key={act.id} className={`flex items-center justify-between p-4 border-b border-outline-variant/30 last:border-b-0 cursor-pointer transition-colors duration-200 ${act.colorClass === 'bg-surface-container-high' ? 'bg-surface hover:bg-surface-container-lowest' : 'bg-error-container/10 hover:bg-error-container/20'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${act.colorClass}`}>
                                                    <span className="material-symbols-outlined">{act.icon}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="font-bold text-sm text-on-surface">{act.nama}</p>
                                                    <p className="font-body-md text-on-surface-variant text-xs">{act.jenis_aksi} • {act.waktu}</p>
                                                </div>
                                            </div>
                                            <span className={`font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1 ${act.status === 'Tertunda' ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                                                {act.status}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* --- TAB ANAK --- */}
                        {activeTab === 'anak' && (
                            <div className="flex flex-col gap-4 animate-fade-in-up">
                                <div className="flex justify-between items-center bg-surface p-4 rounded-2xl border border-outline-variant/50 shadow-sm">
                                    <div className="flex items-center gap-3 text-on-surface-variant">
                                        <div className="bg-primary-container text-on-primary-container p-2 rounded-full flex">
                                            <span className="material-symbols-outlined">child_care</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-on-surface">Total Balita</p>
                                            <p className="text-sm">{balitaList.length} anak terdaftar</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setEditBalitaData(null); setIsAddModalOpen(true); }} className="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm text-sm">
                                        <span className="material-symbols-outlined text-[18px]">add</span> Tambah Anak
                                    </button>
                                </div>
                                
                                {/* Filter and Search */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                                        <input 
                                            type="text" 
                                            placeholder="Cari nama balita, NIK, atau ortu..." 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-outline-variant/50 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                                        />
                                    </div>
                                    {posyanduFilter.length > 0 && (
                                        <select 
                                            value={filterPosyandu}
                                            onChange={(e) => setFilterPosyandu(e.target.value)}
                                            className="px-4 py-2.5 bg-surface rounded-xl border border-outline-variant/50 outline-none focus:border-primary text-sm min-w-[150px]"
                                        >
                                            <option value="">Semua Posyandu</option>
                                            {posyanduFilter.map(p => (
                                                <option key={p.id} value={p.id}>{p.nama}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                
                                <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[600px]">
                                        <thead>
                                            <tr className="bg-surface-container-low border-b border-outline-variant/50">
                                                <th className="py-3 px-4 text-xs uppercase tracking-wider text-on-surface-variant font-bold w-16 text-center">No</th>
                                                <th className="py-3 px-4 text-xs uppercase tracking-wider text-on-surface-variant font-bold">Identitas Anak</th>
                                                <th className="py-3 px-4 text-xs uppercase tracking-wider text-on-surface-variant font-bold">Orang Tua</th>
                                                <th className="py-3 px-4 text-xs uppercase tracking-wider text-on-surface-variant font-bold">Usia</th>
                                                <th className="py-3 px-4 text-xs uppercase tracking-wider text-on-surface-variant font-bold text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {balitaList
                                                .filter(b => {
                                                    const matchSearch = b.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                                        (b.nik && b.nik.includes(searchQuery)) ||
                                                                        (b.nama_ibu && b.nama_ibu.toLowerCase().includes(searchQuery.toLowerCase()));
                                                    const matchPosyandu = filterPosyandu ? b.posyandu_id === parseInt(filterPosyandu) : true;
                                                    return matchSearch && matchPosyandu;
                                                })
                                                .map((balita, index) => (
                                                <tr key={balita.id} className="border-b border-outline-variant/30 hover:bg-surface-container-lowest transition-colors">
                                                    <td className="py-3 px-4 font-body-sm text-on-surface-variant text-center">{index + 1}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="font-bold text-sm text-on-surface">{balita.nama}</div>
                                                        <div className="text-xs text-on-surface-variant mt-0.5">NIK: {balita.nik || '-'}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-sm text-on-surface">{balita.nama_ibu || '-'}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-sm text-on-surface">{balita.usia_bulan} bulan</div>
                                                    </td>
                                                    <td className="py-3 px-4 flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => { setSelectedBalitaForUkur(balita); setIsUkurModalOpen(true); }}
                                                            className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:bg-primary hover:text-on-primary shadow-sm transition-colors"
                                                            title="Ukur"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">straighten</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => { setSelectedBalitaForRiwayat(balita); setIsRiwayatModalOpen(true); }}
                                                            className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center hover:bg-tertiary hover:text-on-tertiary shadow-sm transition-colors"
                                                            title="Riwayat"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">history</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => { setEditBalitaData(balita); setIsAddModalOpen(true); }}
                                                            className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center hover:bg-secondary hover:text-on-secondary shadow-sm transition-colors"
                                                            title="Edit"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteBalita(balita)}
                                                            className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center hover:bg-error hover:text-on-error shadow-sm transition-colors"
                                                            title="Hapus"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {balitaList.length === 0 && (
                                                <tr><td colSpan="5" className="py-8 text-center text-on-surface-variant">Belum ada anak terdaftar.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </section>
                </main>
            </div>

            {/* --- MOBILE DRAWER NAVBAR --- */}
            <div className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ease-in-out ${isDrawerOpen ? 'bg-on-background/50 backdrop-blur-sm opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsDrawerOpen(false)}>
                <aside onClick={(e) => e.stopPropagation()} className={`h-full w-72 bg-surface shadow-2xl flex flex-col py-4 transition-transform duration-300 ease-out transform ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="px-4 pb-6 border-b border-outline-variant flex flex-col gap-2 relative">
                        <button onClick={() => setIsDrawerOpen(false)} className="absolute top-4 right-4 material-symbols-outlined text-on-surface-variant p-2 rounded-full hover:bg-surface-variant">close</button>
                        <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-2 mt-2 shadow-inner border border-outline-variant/30 text-2xl font-bold">
                            {data.user.name ? data.user.name.charAt(0).toUpperCase() : 'K'}
                        </div>
                        <h2 className="font-headline-md text-primary font-bold">{data.user.name || "Kader"}</h2>
                        <p className="font-body-md text-on-surface-variant">Kader Posyandu</p>
                        <p className="text-xs text-on-surface-variant mt-1 font-bold">{data.user.lokasi || 'Posyandu'}</p>
                    </div>
                    <nav className="flex flex-col gap-2 mt-4 overflow-y-auto px-4 flex-1">
                        <button onClick={() => {setActiveTab('aktivitas'); setIsDrawerOpen(false);}} className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all ${activeTab === 'aktivitas' ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                            <span className="material-symbols-outlined">dashboard</span>
                            Aktivitas Terakhir
                        </button>
                        <button onClick={() => {setActiveTab('anak'); setIsDrawerOpen(false);}} className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all ${activeTab === 'anak' ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                            <span className="material-symbols-outlined">child_care</span>
                            Data Balita
                        </button>
                    </nav>
                    <div className="p-4 border-t border-outline-variant flex flex-col gap-2">
                        <button onClick={() => { setIsDrawerOpen(false); navigate('/profil'); }} className="flex items-center gap-3 w-full py-3 px-4 text-on-surface-variant hover:bg-surface-container rounded-xl font-bold transition-colors">
                            <span className="material-symbols-outlined">manage_accounts</span>
                            Pengaturan Profil
                        </button>
                        <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full py-3 px-4 text-error bg-error-container hover:bg-error hover:text-on-error rounded-xl font-bold shadow-sm transition-colors">
                            <span className="material-symbols-outlined">logout</span>
                            Keluar
                        </button>
                    </div>
                </aside>
            </div>

            <AddBalitaModal 
                isOpen={isAddModalOpen} 
                editData={editBalitaData}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditBalitaData(null);
                }} 
                onSuccess={() => {
                    fetchData(); // refresh dashboard data
                }} 
            />

            <UkurBalitaModal
                isOpen={isUkurModalOpen}
                onClose={() => { 
                    setIsUkurModalOpen(false); 
                    setSelectedBalitaForUkur(null); 
                    setSelectedMeasurementForEdit(null);
                }}
                onSuccess={() => {
                    fetchData();
                    if (selectedBalitaForUkur) {
                        setSelectedBalitaForRiwayat(selectedBalitaForUkur);
                        setIsRiwayatModalOpen(true);
                    }
                    setSelectedMeasurementForEdit(null);
                }}
                balita={selectedBalitaForUkur}
                editData={selectedMeasurementForEdit}
            />

            <RiwayatBalitaModal
                isOpen={isRiwayatModalOpen}
                onClose={() => { setIsRiwayatModalOpen(false); setSelectedBalitaForRiwayat(null); }}
                balita={selectedBalitaForRiwayat}
                onEdit={(measurement) => {
                    setIsRiwayatModalOpen(false);
                    setSelectedBalitaForUkur(selectedBalitaForRiwayat);
                    setSelectedMeasurementForEdit(measurement);
                    setIsUkurModalOpen(true);
                }}
            />
        </div>
    );
}