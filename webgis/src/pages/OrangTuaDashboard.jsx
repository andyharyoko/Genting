import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import RiwayatBalitaModal from '../components/RiwayatBalitaModal';

const OrangTuaDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [balitaList, setBalitaList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkForm, setLinkForm] = useState({
        nama_anak: '',
        tanggal_lahir: '',
        nama_ibu: ''
    });

    const [selectedBalita, setSelectedBalita] = useState(null);
    const [isRiwayatModalOpen, setIsRiwayatModalOpen] = useState(false);

    const fetchUserAndData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userData = JSON.parse(userStr);
                setUser(userData);
            }

            const res = await axios.get('/api/v1/orangtua/balita', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBalitaList(res.data.data);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserAndData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleLinkBalita = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('auth_token');
            await axios.post('/api/v1/orangtua/link-balita', linkForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Berhasil menautkan data Balita!');
            setShowLinkModal(false);
            setLinkForm({ nama_anak: '', tanggal_lahir: '', nama_ibu: '' });
            fetchUserAndData();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menautkan data.');
        }
    };

    const handleViewRiwayat = (balita) => {
        setSelectedBalita(balita);
        setIsRiwayatModalOpen(true);
    };

    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-background text-on-background">Memuat data...</div>;
    }

    return (
        <div className="bg-background text-on-background font-body-md antialiased min-h-screen">
            {/* Header */}
            <header className="bg-surface border-b border-outline-variant/30 sticky top-0 z-30 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xl">
                            {user?.name?.charAt(0).toUpperCase() || 'O'}
                        </div>
                        <div>
                            <h1 className="font-headline-sm font-bold text-primary">Dashboard Orang Tua</h1>
                            <p className="text-sm text-on-surface-variant">Halo, {user?.name}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-error hover:bg-error-container rounded-full transition-colors flex items-center justify-center" title="Keluar">
                        <span className="material-symbols-outlined">logout</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
                
                <div className="flex justify-between items-center bg-surface p-6 rounded-2xl border border-outline-variant/50 shadow-sm animate-fade-in-up">
                    <div>
                        <h2 className="font-title-lg font-bold text-on-surface">Data Anak</h2>
                        <p className="text-on-surface-variant text-sm mt-1">Pantau perkembangan anak Anda dengan mudah.</p>
                    </div>
                    <button onClick={() => setShowLinkModal(true)} className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-label-md flex items-center gap-2 hover:bg-primary/90 shadow-md transition-all">
                        <span className="material-symbols-outlined text-[18px]">child_care</span> Tautkan Anak
                    </button>
                </div>

                {balitaList.length === 0 ? (
                    <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/50 border-dashed text-center animate-fade-in-up delay-75">
                        <span className="material-symbols-outlined text-4xl text-primary/50 mb-3">volunteer_activism</span>
                        <h3 className="font-title-md font-bold text-on-surface mb-2">Belum ada data anak</h3>
                        <p className="text-on-surface-variant text-sm mb-4">Silakan tautkan data anak Anda agar dapat memantau grafik KMS.</p>
                        <button onClick={() => setShowLinkModal(true)} className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg font-bold hover:bg-secondary hover:text-on-secondary transition-colors inline-flex items-center gap-2">
                            Mulai Tautkan Anak
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up delay-75">
                        {balitaList.map((balita) => (
                            <div key={balita.balita_id} className="bg-surface p-5 rounded-2xl border border-outline-variant/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-6xl text-primary">face</span>
                                </div>
                                <h3 className="font-title-md font-bold text-on-surface mb-1 relative z-10">{balita.nama_lengkap}</h3>
                                <div className="text-sm text-on-surface-variant flex flex-col gap-1 mb-4 relative z-10">
                                    <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">calendar_month</span> Lhr: {balita.tanggal_lahir}</span>
                                    <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">wc</span> {balita.jenis_kelamin === '1' ? 'Laki-laki' : (balita.jenis_kelamin === '2' ? 'Perempuan' : balita.jenis_kelamin)}</span>
                                </div>
                                <button onClick={() => handleViewRiwayat(balita)} className="w-full py-2.5 bg-primary-container text-on-primary-container rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-on-primary transition-colors relative z-10">
                                    <span className="material-symbols-outlined text-[18px]">monitoring</span> Lihat KMS
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Link Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowLinkModal(false)}></div>
                    <div className="bg-surface relative z-10 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center">
                            <h2 className="font-headline-sm font-bold text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined">link</span> Tautkan Anak
                            </h2>
                            <button onClick={() => setShowLinkModal(false)} className="p-2 hover:bg-surface-variant rounded-full material-symbols-outlined text-on-surface-variant transition-colors">close</button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleLinkBalita} className="flex flex-col gap-4">
                                <div className="bg-primary-container/30 p-3 rounded-xl mb-2 text-sm text-on-surface">
                                    <strong>Catatan:</strong> Pastikan data yang dimasukkan <b>sama persis</b> dengan data yang terdaftar di Posyandu.
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-on-surface mb-1">Nama Lengkap Anak</label>
                                    <input type="text" required value={linkForm.nama_anak} onChange={e => setLinkForm({...linkForm, nama_anak: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary transition-colors" placeholder="Contoh: Ahmad Fulan" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-on-surface mb-1">Tanggal Lahir Anak</label>
                                    <input type="date" required value={linkForm.tanggal_lahir} onChange={e => setLinkForm({...linkForm, tanggal_lahir: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-on-surface mb-1">Nama Ibu</label>
                                    <input type="text" required value={linkForm.nama_ibu} onChange={e => setLinkForm({...linkForm, nama_ibu: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-primary transition-colors" placeholder="Contoh: Siti Aminah" />
                                </div>
                                <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
                                    <button type="button" onClick={() => setShowLinkModal(false)} className="px-5 py-2.5 rounded-xl font-label-md text-on-surface hover:bg-surface-variant transition-colors">Batal</button>
                                    <button type="submit" className="px-5 py-2.5 rounded-xl font-label-md bg-primary text-on-primary hover:bg-primary/90 shadow-md transition-colors flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">check_circle</span> Tautkan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Riwayat Modal (Read-Only) */}
            {isRiwayatModalOpen && (
                <RiwayatBalitaModal 
                    balita={selectedBalita}
                    isOpen={isRiwayatModalOpen}
                    onClose={() => setIsRiwayatModalOpen(false)}
                    // Assuming RiwayatBalitaModal handles role_level = 0 gracefully.
                    // Even if the buttons appear, backend blocks modifications for role 0.
                />
            )}
        </div>
    );
};

export default OrangTuaDashboard;
