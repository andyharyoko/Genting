import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import RiwayatBalitaModal from '../components/RiwayatBalitaModal';
import UkurBalitaModal from '../components/UkurBalitaModal';

export default function KabupatenDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState({ user: {}, pending_sync: 0, aktivitas_terakhir: [] });
    const [loading, setLoading] = useState(true);
    
    // State for Tabs
    const [activeTab, setActiveTab] = useState('puskesmas'); // 'posyandu', 'anak', 'kader'
    
    // State for Data
    const [balitaList, setBalitaList] = useState([]);
    const [adminPuskesmasList, setAdminPuskesmasList] = useState([]);
    const [showAdminPuskesmasModal, setShowAdminPuskesmasModal] = useState(false);
    const [adminPuskesmasForm, setAdminPuskesmasForm] = useState({ name: '', email: '', password: '', no_hp: '', puskesmas_id: '' });
    const [editAdminPuskesmasId, setEditAdminPuskesmasId] = useState(null);
    const [kaderList, setKaderList] = useState([]);
    const [bidanList, setBidanList] = useState([]);
    const [posyanduList, setPosyanduList] = useState([]);
    
    // State for Search & Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPosyandu, setFilterPosyandu] = useState('');

    // State for Modals
    const [isRiwayatModalOpen, setIsRiwayatModalOpen] = useState(false);
    const [selectedBalitaForRiwayat, setSelectedBalitaForRiwayat] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // State for Ukur Balita
    const [isUkurModalOpen, setIsUkurModalOpen] = useState(false);
    const [selectedBalitaForUkur, setSelectedBalitaForUkur] = useState(null);
    const [selectedMeasurementForEdit, setSelectedMeasurementForEdit] = useState(null);

    // State for Kader Modal
    const [isKaderModalOpen, setIsKaderModalOpen] = useState(false);
    const [editKaderData, setEditKaderData] = useState(null);
    const [kaderForm, setKaderForm] = useState({ name: '', email: '', password: '', no_hp: '', posyandu_ids: [], puskesmas_id: '', desa_id: '' });

    // State for Bidan Modal
    const [isBidanModalOpen, setIsBidanModalOpen] = useState(false);
    const [editBidanData, setEditBidanData] = useState(null);
    const [bidanForm, setBidanForm] = useState({ name: '', email: '', password: '', no_hp: '', desa_ids: [] });
    const [desaOptions, setDesaOptions] = useState([]);

    // State for Posyandu Modal
    const [isPosyanduModalOpen, setIsPosyanduModalOpen] = useState(false);
    const [editPosyanduData, setEditPosyanduData] = useState(null);
    const [posyanduForm, setPosyanduForm] = useState({ nama: '', alamat: '', puskesmas_id: '', desa_id: '' });
    const [puskesmasOptions, setPuskesmasOptions] = useState([]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const headers = { Authorization: `Bearer ${token}` };
            
            const [dashRes, balitaRes, kaderRes, bidanRes, posyanduRes, adminPuskesmasRes] = await Promise.all([
                axios.get('/api/v1/dashboard/kader', { headers }), // We can reuse kader dashboard endpoint for basic stats
                axios.get('/api/v1/balita', { headers }),
                axios.get('/api/v1/kader', { headers }),
                axios.get('/api/v1/bidan', { headers }),
                axios.get('/api/v1/posyandu', { headers }),
                axios.get('/api/v1/admin-puskesmas', { headers })
            ]);
            
            // Adjust user role title
            const dashData = dashRes.data.data;
            dashData.user.lokasi = 'Admin Kabupaten';
            
            setData(dashData);
            setBalitaList(balitaRes.data.data);
            setKaderList(kaderRes.data.data);
            setBidanList(bidanRes.data.data);
            setPosyanduList(posyanduRes.data.data);
            setAdminPuskesmasList(adminPuskesmasRes.data.data);

            if (dashData.user.kabupaten_id) {
                axios.get(`/api/v1/regions/puskesmas/${dashData.user.kabupaten_id}`, { headers })
                     .then(res => { /* setPuskesmasOptions(res.data.data) */ })
                     .catch(err => console.error(err));
            }
            if (dashData.user.kecamatan_id) {
                axios.get(`/api/v1/regions/desa/${dashData.user.kecamatan_id}`, { headers })
                     .then(res => setDesaOptions(res.data.data))
                     .catch(err => console.error(err));
            }
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

    
    // --- ADMIN PUSKESMAS CRUD ---
    const handleSaveAdminPuskesmas = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('auth_token');
            if (editAdminPuskesmasId) {
                await axios.put(`/api/v1/admin-puskesmas/${editAdminPuskesmasId}`, adminPuskesmasForm, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post('/api/v1/admin-puskesmas', adminPuskesmasForm, { headers: { Authorization: `Bearer ${token}` } });
            }
            setShowAdminPuskesmasModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyimpan Admin Puskesmas');
        }
    };

    const handleDeleteAdminPuskesmas = async (id) => {
        if (!window.confirm('Yakin ingin menghapus Admin Puskesmas ini?')) return;
        try {
            const token = localStorage.getItem('auth_token');
            await axios.delete(`/api/v1/admin-puskesmas/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menghapus Admin Puskesmas');
        }
    };

    // --- POSYANDU CRUD ---
    const handleSavePosyandu = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('auth_token');
            if (editPosyanduData) {
                await axios.put(`/api/v1/posyandu/${editPosyanduData.id}`, posyanduForm, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post('/api/v1/posyandu', posyanduForm, { headers: { Authorization: `Bearer ${token}` } });
            }
            setIsPosyanduModalOpen(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyimpan Posyandu');
        }
    };

    const handleDeletePosyandu = async (id) => {
        if (!window.confirm('Yakin ingin menghapus Posyandu ini?')) return;
        try {
            const token = localStorage.getItem('auth_token');
            await axios.delete(`/api/v1/posyandu/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menghapus Posyandu');
        }
    };

    // --- KADER CRUD ---
    const handleSaveKader = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('auth_token');
            if (editKaderData) {
                await axios.put(`/api/v1/kader/${editKaderData.id}`, kaderForm, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post('/api/v1/kader', kaderForm, { headers: { Authorization: `Bearer ${token}` } });
            }
            setIsKaderModalOpen(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyimpan Kader');
        }
    };

    const handleDeleteKader = async (id) => {
        if (!window.confirm('Yakin ingin menghapus Kader ini?')) return;
        try {
            const token = localStorage.getItem('auth_token');
            await axios.delete(`/api/v1/kader/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menghapus Kader');
        }
    };

    // --- BIDAN CRUD ---
    const handleSaveBidan = async (e) => {
        e.preventDefault();
        if (bidanForm.desa_ids.length === 0) {
            alert('Pilih minimal satu desa penempatan.');
            return;
        }
        try {
            const token = localStorage.getItem('auth_token');
            if (editBidanData) {
                await axios.put(`/api/v1/bidan/${editBidanData.id}`, bidanForm, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post('/api/v1/bidan', bidanForm, { headers: { Authorization: `Bearer ${token}` } });
            }
            setIsBidanModalOpen(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyimpan Bidan');
        }
    };

    const handleDeleteBidan = async (id) => {
        if (!window.confirm('Yakin ingin menghapus Bidan ini?')) return;
        try {
            const token = localStorage.getItem('auth_token');
            await axios.delete(`/api/v1/bidan/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menghapus Bidan');
        }
    };

    const handlePosyanduSelect = (e) => {
        const value = parseInt(e.target.value);
        if (e.target.checked) {
            setKaderForm(prev => ({ ...prev, posyandu_ids: [...prev.posyandu_ids, value] }));
        } else {
            setKaderForm(prev => ({ ...prev, posyandu_ids: prev.posyandu_ids.filter(id => id !== value) }));
        }
    };

    return (
        <div className="bg-background text-on-background font-body-md antialiased flex h-screen overflow-hidden">
            
            {/* --- DESKTOP SIDEBAR NAVBAR --- */}
            <aside className="w-64 bg-surface border-r border-outline-variant/30 hidden md:flex flex-col z-40 shadow-sm">
                <div className="p-6 border-b border-outline-variant/30 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mx-auto mb-3 shadow-inner border border-outline-variant/30 text-2xl font-bold">
                        {data.user.name ? data.user.name.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <h2 className="font-headline-md text-primary font-bold">{data.user.name || "Puskesmas Admin"}</h2>
                    <p className="font-body-md text-on-surface-variant text-sm">Admin Kabupaten</p>
                    <p className="text-xs text-on-surface-variant mt-1 font-bold">{data.user.kabupaten_id ? `Dinkes Kab. Tuban` : `Admin Kabupaten`}</p>
                </div>
                <nav className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto">
                    <button 
                        onClick={() => setActiveTab('puskesmas')} 
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'puskesmas' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-surface-container'}`}
                    >
                        <span className="material-symbols-outlined">local_hospital</span> Data Puskesmas
                    </button>
                    <button 
                        onClick={() => setActiveTab('posyandu')} 
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'posyandu' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-surface-container'}`}
                    >
                        <span className="material-symbols-outlined">home_work</span> Data Posyandu
                    </button>
                    <button 
                        onClick={() => setActiveTab('bidan')} 
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'bidan' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-surface-container'}`}
                    >
                        <span className="material-symbols-outlined">medical_information</span> Data Bidan
                    </button>
                    <button 
                        onClick={() => setActiveTab('kader')} 
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'kader' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-surface-container'}`}
                    >
                        <span className="material-symbols-outlined">badge</span> Data Kader
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
                        <h1 className="font-headline-md font-bold text-primary">Puskesmas Dashboard</h1>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in-up bg-background">
                    
                    {/* Header Desktop - Welcome text */}
                    <section className="flex flex-col gap-1 mb-6">
                        <h2 className="font-headline-lg-mobile text-on-surface">
                            {activeTab === 'anak' ? 'Data Anak (KMS)' : activeTab === 'posyandu' ? 'Kelola Data Posyandu' : activeTab === 'kader' ? 'Kelola Data Kader' : 'Data Puskesmas Pembina'}
                        </h2>
                        <p className="font-body-md text-on-surface-variant flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">health_and_safety</span>
                            Wilayah Kewenangan Puskesmas
                        </p>
                    </section>

                    <section className="flex flex-col gap-stack-md">
                        
                        {/* --- TAB PUSKESMAS --- */}
                        {activeTab === 'puskesmas' && (
                            <div className="flex flex-col gap-4 animate-fade-in-up">
                                <div className="flex justify-between items-center bg-surface p-4 rounded-2xl border border-outline-variant/50 shadow-sm">
                                    <div className="flex items-center gap-3 text-on-surface-variant">
                                        <div className="bg-primary-container text-on-primary-container p-2 rounded-full flex">
                                            <span className="material-symbols-outlined">local_hospital</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-on-surface">Total Admin Puskesmas</p>
                                            <p className="text-sm">{adminPuskesmasList.length} admin terdaftar</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setEditAdminPuskesmasId(null); setAdminPuskesmasForm({name:'', email:'', password:'', no_hp:'', puskesmas_id:''}); setShowAdminPuskesmasModal(true); }} className="px-4 py-2.5 bg-primary text-on-primary rounded-xl font-label-md flex items-center gap-2 hover:bg-primary/90 shadow-md">
                                        <span className="material-symbols-outlined text-[18px]">add</span> Tambah Admin
                                    </button>
                                </div>
                                
                                <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-surface-container-low border-b border-outline-variant/50">
                                                <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold">Nama Admin</th>
                                                <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold">Email</th>
                                                <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold">Puskesmas</th>
                                                <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adminPuskesmasList.map(admin => (
                                                <tr key={admin.id} className="border-b border-outline-variant/30 hover:bg-surface-container-lowest transition-colors">
                                                    <td className="py-3 px-4 font-title-sm text-on-surface font-bold">{admin.name}</td>
                                                    <td className="py-3 px-4 font-body-sm text-on-surface-variant">{admin.email}</td>
                                                    <td className="py-3 px-4 font-body-sm">
                                                        <span className="bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full text-[11px] font-bold">
                                                            {admin.puskesmas_nama || 'Belum ditugaskan'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 flex justify-end gap-2">
                                                        <button onClick={() => { setEditAdminPuskesmasId(admin.id); setAdminPuskesmasForm({name: admin.name, email: admin.email, password: '', no_hp: admin.no_hp || '', puskesmas_id: admin.puskesmas_id || ''}); setShowAdminPuskesmasModal(true); }} className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center hover:bg-secondary hover:text-on-secondary shadow-sm">
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                        <button onClick={() => handleDeleteAdminPuskesmas(admin.id)} className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center hover:bg-error hover:text-on-error shadow-sm">
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {adminPuskesmasList.length === 0 && (
                                                <tr><td colSpan="4" className="py-8 text-center text-on-surface-variant">Belum ada admin puskesmas.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* --- TAB POSYANDU --- */}
                        {activeTab === 'posyandu' && (
                            <div className="flex flex-col gap-4 animate-fade-in-up">
                                <div className="flex justify-between items-center bg-surface p-4 rounded-2xl border border-outline-variant/50 shadow-sm">
                                    <div className="flex items-center gap-3 text-on-surface-variant">
                                        <div className="bg-primary-container text-on-primary-container p-2 rounded-full flex">
                                            <span className="material-symbols-outlined">home_work</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-on-surface">Total Posyandu</p>
                                            <p className="text-sm">{posyanduList.length} posyandu terdaftar</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setEditPosyanduData(null); setPosyanduForm({nama:'', alamat:'', puskesmas_id: data.user?.puskesmas_id || '', desa_id: ''}); setIsPosyanduModalOpen(true); }} className="px-4 py-2.5 bg-primary text-on-primary rounded-xl font-label-md flex items-center gap-2 hover:bg-primary/90 shadow-md">
                                        <span className="material-symbols-outlined text-[18px]">add</span> Tambah Posyandu
                                    </button>
                                </div>
                                
                                <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-surface-container-low border-b border-outline-variant/50">
                                                <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold">Nama Posyandu</th>
                                                <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold">Desa</th>
                                                <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold">Puskesmas Induk</th>
                                                <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold">Alamat</th>
                                                <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {posyanduList.map(posyandu => (
                                                <tr key={posyandu.id} className="border-b border-outline-variant/30 hover:bg-surface-container-lowest transition-colors">
                                                    <td className="py-3 px-4 font-title-sm text-on-surface font-bold">{posyandu.nama}</td>
                                                    <td className="py-3 px-4 font-body-sm text-on-surface-variant">{posyandu.desa_nama || '-'}</td>
                                                    <td className="py-3 px-4 font-body-sm">
                                                        {posyandu.puskesmas_nama ? (
                                                            <span className="bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full text-[11px] font-bold">
                                                                {posyandu.puskesmas_nama}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="py-3 px-4 font-body-sm text-on-surface-variant">{posyandu.alamat || '-'}</td>
                                                    <td className="py-3 px-4 flex justify-end gap-2">
                                                        <button onClick={() => { setEditPosyanduData(posyandu); setPosyanduForm({nama: posyandu.nama, alamat: posyandu.alamat, puskesmas_id: posyandu.puskesmas_id || '', desa_id: posyandu.desa_id || ''}); setIsPosyanduModalOpen(true); }} className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center hover:bg-secondary hover:text-on-secondary shadow-sm">
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                        <button onClick={() => handleDeletePosyandu(posyandu.id)} className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center hover:bg-error hover:text-on-error shadow-sm">
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {posyanduList.length === 0 && (
                                                <tr><td colSpan="3" className="py-8 text-center text-on-surface-variant">Belum ada posyandu yang terdaftar.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* --- TAB ANAK --- */}
                        {activeTab === 'anak' && (
                            <div className="flex flex-col gap-4 animate-fade-in-up">
                                <div className="flex flex-col sm:flex-row gap-3 bg-surface p-4 rounded-2xl border border-outline-variant/50 shadow-sm">
                                    <div className="relative flex-1">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px]">search</span>
                                        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari nama balita..." className="w-full pl-9 pr-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:border-primary outline-none transition-colors" />
                                    </div>
                                    <div className="relative sm:w-64">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px]">home_work</span>
                                        <select value={filterPosyandu} onChange={e => setFilterPosyandu(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-surface border border-outline-variant rounded-xl appearance-none focus:border-primary outline-none transition-colors">
                                            <option value="">Semua Posyandu</option>
                                            {posyanduList.map(p => (
                                                <option key={p.id} value={String(p.id)}>{p.nama}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {(() => {
                                    const filtered = balitaList.filter(b => {
                                        const matchSearch = !searchQuery || b.nama.toLowerCase().includes(searchQuery.toLowerCase());
                                        const matchPos = !filterPosyandu || String(b.posyandu_id) === filterPosyandu;
                                        return matchSearch && matchPos;
                                    });

                                    return loading ? (
                                        <div className="p-8 text-center text-on-surface-variant bg-surface rounded-2xl border border-outline-variant/50 animate-pulse">Memuat data balita...</div>
                                    ) : (
                                    <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-surface-container-low border-b border-outline-variant/50">
                                                        <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold whitespace-nowrap">Nama Anak</th>
                                                        <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold whitespace-nowrap">Tgl Lahir</th>
                                                        <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold whitespace-nowrap">Posyandu</th>
                                                        <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold min-w-[200px]">Alamat</th>
                                                        <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold text-right whitespace-nowrap">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filtered.map(balita => (
                                                        <tr key={balita.id} className="border-b border-outline-variant/30 hover:bg-surface-container-lowest transition-colors">
                                                            <td className="py-3 px-4 font-title-sm text-on-surface font-bold">{balita.nama}</td>
                                                            <td className="py-3 px-4 font-body-sm text-on-surface whitespace-nowrap">{balita.tanggal_lahir}</td>
                                                            <td className="py-3 px-4 font-body-sm">
                                                                <span className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap">{balita.posyandu || '-'}</span>
                                                            </td>
                                                            <td className="py-3 px-4 font-body-sm text-on-surface-variant text-xs">{balita.alamat || '-'}</td>
                                                            <td className="py-3 px-4 flex justify-end gap-2">
                                                                <button 
                                                                    onClick={() => { setSelectedBalitaForRiwayat(balita); setIsRiwayatModalOpen(true); }}
                                                                    className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center hover:bg-tertiary hover:text-on-tertiary shadow-sm transition-colors" 
                                                                    title="Riwayat KMS"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">monitoring</span>
                                                                </button>
                                                                <button 
                                                                    onClick={() => { setSelectedBalitaForUkur(balita); setIsUkurModalOpen(true); }}
                                                                    className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors shadow-sm" 
                                                                    title="Input Pengukuran Baru"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">straighten</span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {filtered.length === 0 && (
                                                        <tr><td colSpan="5" className="py-8 text-center text-on-surface-variant">Tidak ada data balita ditemukan.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    );
                                })()}
                            </div>
                        )}
                        {/* --- TAB BIDAN --- */}
                        {activeTab === 'bidan' && (
                            <div className="flex flex-col gap-4 animate-fade-in-up">
                                <div className="flex justify-between items-center bg-surface p-4 rounded-2xl border border-outline-variant/50 shadow-sm">
                                    <div className="flex items-center gap-3 text-on-surface-variant">
                                        <div className="bg-primary-container text-on-primary-container p-2 rounded-full flex">
                                            <span className="material-symbols-outlined">medical_information</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-on-surface">Total Bidan</p>
                                            <p className="text-sm">{bidanList.length} bidan aktif</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setEditBidanData(null); setBidanForm({name:'', email:'', password:'', no_hp:'', desa_ids:[]}); setIsBidanModalOpen(true); }} className="px-4 py-2.5 bg-primary text-on-primary rounded-xl font-label-md flex items-center gap-2 hover:bg-primary/90 shadow-md">
                                        <span className="material-symbols-outlined text-[18px]">person_add</span> Tambah Bidan
                                    </button>
                                </div>
                                
                                <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-surface-container-low border-b border-outline-variant/50">
                                                <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold">Nama Bidan</th>
                                                <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold">Desa Penempatan</th>
                                                <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold">Kontak</th>
                                                <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bidanList.map(bidan => (
                                                <tr key={bidan.id} className="border-b border-outline-variant/30 hover:bg-surface-container-lowest transition-colors">
                                                    <td className="py-3 px-4 font-title-sm text-on-surface font-bold">{bidan.name}</td>
                                                    <td className="py-3 px-4 font-body-sm text-on-surface-variant">
                                                        {bidan.desa_list && bidan.desa_list.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {bidan.desa_list.map(d => (
                                                                    <span key={d.id} className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap">
                                                                        {d.nama}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-error text-xs italic">Belum ada desa</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 font-body-sm text-on-surface-variant">
                                                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">mail</span> {bidan.email}</div>
                                                        <div className="flex items-center gap-1 text-[12px] mt-1"><span className="material-symbols-outlined text-[14px]">call</span> {bidan.no_hp || '-'}</div>
                                                    </td>
                                                    <td className="py-3 px-4 flex justify-end gap-2">
                                                        <button onClick={() => { setEditBidanData(bidan); setBidanForm({name: bidan.name, email: bidan.email, password: '', no_hp: bidan.no_hp || '', desa_ids: bidan.desa_list ? bidan.desa_list.map(d => d.id) : (bidan.desa_id ? [bidan.desa_id] : [])}); setIsBidanModalOpen(true); }} className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center hover:bg-secondary hover:text-on-secondary shadow-sm">
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                        <button onClick={() => handleDeleteBidan(bidan.id)} className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center hover:bg-error hover:text-on-error shadow-sm">
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {bidanList.length === 0 && (
                                                <tr><td colSpan="3" className="py-8 text-center text-on-surface-variant">Belum ada bidan terdaftar.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* --- TAB KADER --- */}
                        {activeTab === 'kader' && (
                            <div className="flex flex-col gap-4 animate-fade-in-up">
                                <div className="flex justify-between items-center bg-surface p-4 rounded-2xl border border-outline-variant/50 shadow-sm">
                                    <div className="flex items-center gap-3 text-on-surface-variant">
                                        <div className="bg-tertiary-container text-on-tertiary-container p-2 rounded-full flex">
                                            <span className="material-symbols-outlined">badge</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-on-surface">Total Kader</p>
                                            <p className="text-sm">{kaderList.length} kader aktif</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setEditKaderData(null); setKaderForm({name:'', email:'', password:'', no_hp:'', posyandu_ids:[], puskesmas_id: data.user?.puskesmas_id || '', desa_id: ''}); setIsKaderModalOpen(true); }} className="px-4 py-2.5 bg-primary text-on-primary rounded-xl font-label-md flex items-center gap-2 hover:bg-primary/90 shadow-md">
                                        <span className="material-symbols-outlined text-[18px]">person_add</span> Tambah Kader
                                    </button>
                                </div>
                                
                                <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-surface-container-low border-b border-outline-variant/50">
                                                <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold">Nama Kader</th>
                                                <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold">Kontak</th>
                                                <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold">Posyandu Diampu</th>
                                                <th className="py-3 px-4 font-label-sm text-on-surface-variant font-bold text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {kaderList.map(kader => (
                                                <tr key={kader.id} className="border-b border-outline-variant/30 hover:bg-surface-container-lowest transition-colors">
                                                    <td className="py-3 px-4 font-title-sm text-on-surface font-bold">{kader.name}</td>
                                                    <td className="py-3 px-4 font-body-sm text-on-surface-variant">
                                                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">mail</span> {kader.email}</div>
                                                        <div className="flex items-center gap-1 text-[12px] mt-1"><span className="material-symbols-outlined text-[14px]">call</span> {kader.no_hp || '-'}</div>
                                                    </td>
                                                    <td className="py-3 px-4 font-body-sm">
                                                        <div className="flex flex-wrap gap-1">
                                                            {kader.posyandu_list?.map(p => (
                                                                <span key={p.id} className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full text-[11px] font-bold">{p.nama}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 flex justify-end gap-2">
                                                        <button onClick={() => { setEditKaderData(kader); setKaderForm({name: kader.name, email: kader.email, password: '', no_hp: kader.no_hp || '', posyandu_ids: kader.posyandu_list.map(p => p.id), puskesmas_id: data.user?.puskesmas_id || '', desa_id: ''}); setIsKaderModalOpen(true); }} className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center hover:bg-secondary hover:text-on-secondary shadow-sm">
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                        <button onClick={() => handleDeleteKader(kader.id)} className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center hover:bg-error hover:text-on-error shadow-sm">
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {kaderList.length === 0 && (
                                                <tr><td colSpan="4" className="py-8 text-center text-on-surface-variant">Belum ada kader terdaftar.</td></tr>
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
                            {data.user.name ? data.user.name.charAt(0).toUpperCase() : 'B'}
                        </div>
                        <h2 className="font-headline-md text-primary font-bold">{data.user.name || "Puskesmas Admin"}</h2>
                        <p className="font-body-md text-on-surface-variant">Admin Kabupaten</p>
                        <p className="text-xs text-on-surface-variant mt-1 font-bold">{data.user.kabupaten_id ? `Dinkes Kab. Tuban` : `Admin Kabupaten`}</p>
                    </div>
                    <nav className="flex flex-col gap-2 mt-4 overflow-y-auto px-4 flex-1">
                        <button onClick={() => {setActiveTab('puskesmas'); setIsDrawerOpen(false);}} className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all ${activeTab === 'puskesmas' ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                            <span className="material-symbols-outlined">local_hospital</span>
                            Data Puskesmas
                        </button>
                        <button onClick={() => {setActiveTab('posyandu'); setIsDrawerOpen(false);}} className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all ${activeTab === 'posyandu' ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                            <span className="material-symbols-outlined">home_work</span>
                            Data Posyandu
                        </button>
                        <button onClick={() => {setActiveTab('bidan'); setIsDrawerOpen(false);}} className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all ${activeTab === 'bidan' ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                            <span className="material-symbols-outlined">medical_information</span>
                            Data Bidan
                        </button>
                        <button onClick={() => {setActiveTab('kader'); setIsDrawerOpen(false);}} className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all ${activeTab === 'kader' ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                            <span className="material-symbols-outlined">badge</span>
                            Data Kader
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

            
            {/* --- ADMIN PUSKESMAS MODAL --- */}
            {showAdminPuskesmasModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowAdminPuskesmasModal(false)}></div>
                    <div className="bg-surface relative z-10 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                            <h2 className="font-headline-md text-primary font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined">{editAdminPuskesmasId ? 'edit' : 'person_add'}</span>
                                {editAdminPuskesmasId ? 'Edit Admin Puskesmas' : 'Tambah Admin Puskesmas'}
                            </h2>
                            <button onClick={() => setShowAdminPuskesmasModal(false)} className="p-2 hover:bg-surface-variant rounded-full material-symbols-outlined text-on-surface-variant transition-colors">close</button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[80vh]">
                            <form onSubmit={handleSaveAdminPuskesmas} className="flex flex-col gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-on-surface mb-1">Nama Lengkap</label>
                                    <input type="text" required value={adminPuskesmasForm.name} onChange={e => setAdminPuskesmasForm({...adminPuskesmasForm, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary transition-colors" placeholder="Nama Admin" />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-on-surface mb-1">Email / Username</label>
                                        <input type="email" required value={adminPuskesmasForm.email} onChange={e => setAdminPuskesmasForm({...adminPuskesmasForm, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary transition-colors" placeholder="email@contoh.com" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-on-surface mb-1">No HP</label>
                                        <input type="text" value={adminPuskesmasForm.no_hp} onChange={e => setAdminPuskesmasForm({...adminPuskesmasForm, no_hp: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary transition-colors" placeholder="08123456789" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-on-surface mb-1">Password {editAdminPuskesmasId && '(Kosongkan jika tidak diubah)'}</label>
                                    <input type="password" required={!editAdminPuskesmasId} minLength={6} value={adminPuskesmasForm.password} onChange={e => setAdminPuskesmasForm({...adminPuskesmasForm, password: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary transition-colors" placeholder="Minimal 6 karakter" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-on-surface mb-1">Puskesmas</label>
                                    <select 
                                        required 
                                        value={adminPuskesmasForm.puskesmas_id} 
                                        onChange={e => setAdminPuskesmasForm({...adminPuskesmasForm, puskesmas_id: e.target.value})} 
                                        className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl appearance-none outline-none focus:border-primary transition-colors"
                                    >
                                        <option value="">-- Pilih Puskesmas --</option>
                                        {puskesmasOptions.map(p => (
                                            <option key={p.id} value={p.id}>{p.nama}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mt-4 flex justify-end gap-3 pt-2 border-t border-outline-variant/30">
                                    <button type="button" onClick={() => setShowAdminPuskesmasModal(false)} className="px-5 py-2.5 rounded-xl font-label-md text-on-surface hover:bg-surface-variant transition-colors">Batal</button>
                                    <button type="submit" className="px-5 py-2.5 rounded-xl font-label-md bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">save</span> Simpan Admin
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* --- BIDAN MODAL --- */}
            {isBidanModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsBidanModalOpen(false)}></div>
                    <div className="bg-surface relative z-10 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                            <h2 className="font-headline-md text-primary font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined">{editBidanData ? 'edit' : 'person_add'}</span>
                                {editBidanData ? 'Edit Data Bidan' : 'Tambah Bidan Baru'}
                            </h2>
                            <button onClick={() => setIsBidanModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full material-symbols-outlined text-on-surface-variant transition-colors">close</button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[80vh]">
                            <form onSubmit={handleSaveBidan} className="flex flex-col gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-on-surface mb-1">Nama Lengkap</label>
                                    <input type="text" required value={bidanForm.name} onChange={e => setBidanForm({...bidanForm, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary transition-colors" placeholder="Masukkan nama bidan" />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-on-surface mb-1">Email / Username</label>
                                        <input type="email" required value={bidanForm.email} onChange={e => setBidanForm({...bidanForm, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary transition-colors" placeholder="email@contoh.com" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-on-surface mb-1">No HP</label>
                                        <input type="text" value={bidanForm.no_hp} onChange={e => setBidanForm({...bidanForm, no_hp: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary transition-colors" placeholder="08123456789" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-on-surface mb-1">Password {editBidanData && '(Kosongkan jika tidak diubah)'}</label>
                                    <input type="password" required={!editBidanData} minLength={6} value={bidanForm.password} onChange={e => setBidanForm({...bidanForm, password: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary transition-colors" placeholder="Minimal 6 karakter" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-on-surface mb-2">Desa Penempatan</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-outline-variant rounded-xl bg-surface">
                                        {desaOptions.length === 0 ? (
                                            <p className="text-sm text-on-surface-variant p-2">Tidak ada desa tersedia</p>
                                        ) : (
                                            desaOptions.map(desa => (
                                                <label key={desa.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-surface-container rounded-lg transition-colors">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={bidanForm.desa_ids.includes(desa.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setBidanForm({...bidanForm, desa_ids: [...bidanForm.desa_ids, desa.id]});
                                                            } else {
                                                                setBidanForm({...bidanForm, desa_ids: bidanForm.desa_ids.filter(id => id !== desa.id)});
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary" 
                                                    />
                                                    <span className="text-sm text-on-surface">{desa.nama}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                    {bidanForm.desa_ids.length === 0 && <p className="text-xs text-error mt-1">Pilih minimal satu desa</p>}
                                </div>
                                <div className="mt-4 flex justify-end gap-3 pt-2 border-t border-outline-variant/30">
                                    <button type="button" onClick={() => setIsBidanModalOpen(false)} className="px-5 py-2.5 rounded-xl font-label-md text-on-surface hover:bg-surface-variant transition-colors">Batal</button>
                                    <button type="submit" className="px-5 py-2.5 rounded-xl font-label-md bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">save</span> Simpan Bidan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* --- KADER MODAL --- */}
            {isKaderModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsKaderModalOpen(false)}></div>
                    <div className="bg-surface relative z-10 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                            <h2 className="font-headline-md text-primary font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined">{editKaderData ? 'edit' : 'person_add'}</span>
                                {editKaderData ? 'Edit Data Kader' : 'Tambah Kader Baru'}
                            </h2>
                            <button onClick={() => setIsKaderModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full material-symbols-outlined text-on-surface-variant transition-colors">close</button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[80vh]">
                            <form onSubmit={handleSaveKader} className="flex flex-col gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-on-surface mb-1">Nama Lengkap</label>
                                    <input type="text" required value={kaderForm.name} onChange={e => setKaderForm({...kaderForm, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary transition-colors" placeholder="Masukkan nama kader" />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-on-surface mb-1">Email / Username</label>
                                        <input type="email" required value={kaderForm.email} onChange={e => setKaderForm({...kaderForm, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary transition-colors" placeholder="email@contoh.com" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-on-surface mb-1">No HP</label>
                                        <input type="text" value={kaderForm.no_hp} onChange={e => setKaderForm({...kaderForm, no_hp: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary transition-colors" placeholder="08123456789" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-on-surface mb-1">Password {editKaderData && '(Kosongkan jika tidak diubah)'}</label>
                                    <input type="password" required={!editKaderData} minLength={6} value={kaderForm.password} onChange={e => setKaderForm({...kaderForm, password: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary transition-colors" placeholder="Minimal 6 karakter" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-on-surface mb-1">Puskesmas Induk (Otomatis)</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px]">local_hospital</span>
                                        <select value={kaderForm.puskesmas_id} onChange={e => setKaderForm({...kaderForm, puskesmas_id: e.target.value})} 
                                            className="w-full pl-9 pr-4 py-2.5 bg-surface border border-outline-variant rounded-xl appearance-none outline-none focus:border-primary transition-colors"
                                        >
                                            <option value="">-- Puskesmas --</option>
                                            {puskesmasOptions.map(p => (
                                                <option key={p.id} value={p.id}>{p.nama}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-on-surface mb-1">Desa Wilayah Kader</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px]">holiday_village</span>
                                        <select 
                                            required 
                                            value={kaderForm.desa_id} 
                                            onChange={e => {
                                                setKaderForm({...kaderForm, desa_id: e.target.value});
                                            }} 
                                            className="w-full pl-9 pr-4 py-2.5 bg-surface border border-outline-variant rounded-xl appearance-none outline-none focus:border-primary transition-colors"
                                        >
                                            <option value="">-- Pilih Desa --</option>
                                            {desaOptions.map(d => (
                                                <option key={d.id} value={d.id}>{d.nama}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-on-surface mb-2">Penugasan Posyandu <span className="text-primary font-bold">({kaderForm.posyandu_ids.length} dipilih)</span></label>
                                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto p-3 border border-outline-variant rounded-xl bg-surface-container-lowest">
                                        {!kaderForm.desa_id ? (
                                            <p className="text-sm text-on-surface-variant italic">Pilih desa terlebih dahulu.</p>
                                        ) : posyanduList.filter(p => p.desa_id === kaderForm.desa_id).length === 0 ? (
                                            <p className="text-sm text-on-surface-variant italic">Belum ada posyandu di desa ini.</p>
                                        ) : (
                                            posyanduList.filter(p => p.desa_id === kaderForm.desa_id).map(p => (
                                                <label key={p.id} className="flex items-center gap-3 cursor-pointer hover:bg-surface-variant/50 p-2 rounded-lg transition-colors">
                                                    <input 
                                                        type="checkbox" 
                                                        value={p.id} 
                                                        checked={kaderForm.posyandu_ids.includes(p.id)}
                                                        onChange={handlePosyanduSelect}
                                                        className="w-5 h-5 text-primary rounded border-outline-variant cursor-pointer"
                                                    />
                                                    <span className="text-sm font-medium">{p.nama}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end gap-3 pt-2 border-t border-outline-variant/30">
                                    <button type="button" onClick={() => setIsKaderModalOpen(false)} className="px-5 py-2.5 rounded-xl font-label-md text-on-surface hover:bg-surface-variant transition-colors">Batal</button>
                                    <button type="submit" className="px-5 py-2.5 rounded-xl font-label-md bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">save</span> Simpan Kader
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* --- POSYANDU MODAL --- */}
            {isPosyanduModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsPosyanduModalOpen(false)}></div>
                    <div className="bg-surface relative z-10 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                            <h2 className="font-headline-md text-primary font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined">{editPosyanduData ? 'edit' : 'home_work'}</span>
                                {editPosyanduData ? 'Edit Posyandu' : 'Tambah Posyandu'}
                            </h2>
                            <button onClick={() => setIsPosyanduModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full material-symbols-outlined text-on-surface-variant transition-colors">close</button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSavePosyandu} className="flex flex-col gap-5">
                                <div className="p-3 bg-tertiary-container/30 border border-tertiary-container rounded-xl flex flex-col gap-1 mb-2">
                                    <p className="text-xs font-bold text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">info</span> Informasi Wilayah (Otomatis)</p>
                                    <p className="text-sm text-on-surface">Posyandu akan didaftarkan pada wilayah kewenangan Anda secara otomatis (Provinsi, Kabupaten, Kecamatan).</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-on-surface mb-1">Nama Posyandu</label>
                                    <input type="text" required value={posyanduForm.nama} onChange={e => setPosyanduForm({...posyanduForm, nama: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary transition-colors" placeholder="Contoh: Posyandu Melati 1" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-on-surface mb-1">Puskesmas Induk (Opsional)</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px]">local_hospital</span>
                                        <select value={posyanduForm.puskesmas_id} onChange={e => setPosyanduForm({...posyanduForm, puskesmas_id: e.target.value})} 
                                            onChange={e => setPosyanduForm({...posyanduForm, puskesmas_id: e.target.value})} 
                                            className={`w-full pl-9 pr-4 py-2.5 border border-outline-variant rounded-xl appearance-none outline-none focus:border-primary transition-colors ${data.user?.role_level === 3 ? 'bg-surface-variant text-on-surface-variant opacity-70 cursor-not-allowed' : 'bg-surface'}`}
                                            disabled={data.user?.role_level === 3}
                                        >
                                            <option value="">-- Pilih Puskesmas Pembina --</option>
                                            {puskesmasOptions.map(p => (
                                                <option key={p.id} value={p.id}>{p.nama}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-on-surface mb-1">Desa Lokasi Posyandu</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px]">holiday_village</span>
                                        <select required value={posyanduForm.desa_id} onChange={e => setPosyanduForm({...posyanduForm, desa_id: e.target.value})} className="w-full pl-9 pr-4 py-2.5 bg-surface border border-outline-variant rounded-xl appearance-none outline-none focus:border-primary transition-colors">
                                            <option value="">-- Pilih Desa --</option>
                                            {desaOptions.map(d => (
                                                <option key={d.id} value={d.id}>{d.nama}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-on-surface mb-1">Alamat (Opsional)</label>
                                    <textarea rows={3} value={posyanduForm.alamat} onChange={e => setPosyanduForm({...posyanduForm, alamat: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface resize-none outline-none focus:border-primary transition-colors" placeholder="Contoh: RT 01 RW 02, Balai Desa"></textarea>
                                </div>
                                <div className="mt-4 flex justify-end gap-3 pt-2 border-t border-outline-variant/30">
                                    <button type="button" onClick={() => setIsPosyanduModalOpen(false)} className="px-5 py-2.5 rounded-xl font-label-md text-on-surface hover:bg-surface-variant transition-colors">Batal</button>
                                    <button type="submit" className="px-5 py-2.5 rounded-xl font-label-md bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">save</span> Simpan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Read-Only & Edit History Modal */}
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
        </div>
    );
}