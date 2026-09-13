import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = '/api/v1';
const token = () => localStorage.getItem('auth_token');
const authHeader = () => ({ Authorization: `Bearer ${token()}` });

export default function ProfilKaderPage() {
    const navigate = useNavigate();

    const [profile, setProfile]           = useState(null);
    const [loading, setLoading]           = useState(true);
    const [saving, setSaving]             = useState(false);
    const [msg, setMsg]                   = useState(null);

    // Multi-posyandu
    const [availablePosyandu, setAvailablePosyandu]   = useState([]);
    const [showAddPosyandu, setShowAddPosyandu]       = useState(false);
    const [selectedPosyanduId, setSelectedPosyanduId] = useState('');
    const [addingPosyandu, setAddingPosyandu]         = useState(false);

    // Puskesmas (for Role 3)
    const [availablePuskesmas, setAvailablePuskesmas] = useState([]);

    const [formData, setFormData] = useState({
        name: '', no_hp: '', password: '', password_confirmation: '', puskesmas_id: ''
    });

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/profile`, { headers: authHeader() });
            const d = res.data.data;
            setProfile(d);
            setFormData({ 
                name: d.name, 
                no_hp: d.no_hp || '', 
                password: '', 
                password_confirmation: '',
                puskesmas_id: d.puskesmas_id || ''
            });
            
            if (d.role_level === 3 && d.kabupaten_id) {
                axios.get(`${API}/regions/puskesmas/${d.kabupaten_id}`, { headers: authHeader() })
                     .then(res => setAvailablePuskesmas(res.data.data))
                     .catch(() => {});
            }
        } catch {
            setMsg({ type: 'error', text: 'Gagal memuat profil.' });
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailablePosyandu = async () => {
        try {
            const res = await axios.get(`${API}/profile/posyandu/available`, { headers: authHeader() });
            setAvailablePosyandu(res.data.data || []);
        } catch { /* silent */ }
    };

    useEffect(() => {
        fetchProfile();
        fetchAvailablePosyandu();
    }, []);

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            await axios.put(`${API}/profile`, formData, { headers: authHeader() });
            setMsg({ type: 'success', text: 'Profil berhasil disimpan!' });
            fetchProfile();
        } catch (err) {
            const errors = err.response?.data?.errors;
            const firstError = errors
                ? Object.values(errors)[0][0]
                : (err.response?.data?.message || 'Gagal menyimpan profil.');
            setMsg({ type: 'error', text: firstError });
        } finally {
            setSaving(false);
        }
    };

    const handleAssignPosyandu = async () => {
        if (!selectedPosyanduId) return;
        setAddingPosyandu(true);
        try {
            await axios.post(`${API}/profile/posyandu/assign`,
                { posyandu_id: parseInt(selectedPosyanduId) },
                { headers: authHeader() }
            );
            setSelectedPosyanduId('');
            setShowAddPosyandu(false);
            fetchProfile();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Gagal menambahkan posyandu.' });
        } finally {
            setAddingPosyandu(false);
        }
    };

    const handleRemovePosyandu = async (id) => {
        if (!confirm('Hapus posyandu ini dari daftar tugas Anda?')) return;
        try {
            await axios.delete(`${API}/profile/posyandu/${id}`, { headers: authHeader() });
            fetchProfile();
        } catch {
            setMsg({ type: 'error', text: 'Gagal menghapus posyandu.' });
        }
    };

    const handleSetPrimary = async (id) => {
        try {
            await axios.patch(`${API}/profile/posyandu/${id}/primary`, {}, { headers: authHeader() });
            fetchProfile();
        } catch {
            setMsg({ type: 'error', text: 'Gagal mengatur posyandu utama.' });
        }
    };

    const roleName = level => ({
        0: 'Orang Tua / Wali', 1: 'Kader Posyandu', 2: 'Bidan Desa',
        3: 'Admin Puskesmas', 4: 'Admin Dinkes Tuban', 5: 'Admin Dinkes Jatim', 6: 'Admin Kemenkes'
    })[level] ?? `Level ${level}`;

    // Posyandu yang belum di-assign ke kader ini
    const assignedIds  = (profile?.posyandu_list || []).map(p => p.id);
    const unassigned   = availablePosyandu.filter(p => !assignedIds.includes(p.id));

    const InfoItem = ({ icon, label, value }) => (
        <div className="flex items-start gap-3 py-3 border-b border-outline-variant/30 last:border-0">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-primary text-[18px]">{icon}</span>
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/70 font-bold">{label}</p>
                <p className="font-body-md font-semibold text-on-surface mt-0.5">{value || '-'}</p>
            </div>
        </div>
    );

    return (
        <div className="bg-background text-on-background font-body-md antialiased pb-28 min-h-screen">

            {/* Header */}
            <header className="bg-surface/95 backdrop-blur-md border-b border-outline-variant/50 sticky top-0 z-40 py-4 px-4 flex items-center gap-3">
                <button onClick={() => navigate(-1)}
                    className="material-symbols-outlined p-2 hover:bg-surface-container-high rounded-full transition-all text-primary">
                    arrow_back
                </button>
                <h1 className="font-headline-sm font-bold text-on-surface">Pengaturan Profil</h1>
            </header>

            <div className="max-w-2xl mx-auto px-4 pt-6 flex flex-col gap-5">

                {loading ? (
                    <div className="flex items-center justify-center py-24 gap-3 text-primary">
                        <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
                        <span className="font-label-md">Memuat profil...</span>
                    </div>
                ) : profile && (
                    <>
                        {/* Hero Card */}
                        <div className="relative bg-gradient-to-br from-primary to-blue-700 rounded-3xl p-6 text-on-primary shadow-xl overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 translate-x-16 -translate-y-16" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/10 -translate-x-12 translate-y-12" />
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold shrink-0 shadow-inner backdrop-blur-sm border border-white/30">
                                    {profile.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-headline-sm font-bold leading-tight">{profile.name}</p>
                                    <p className="text-sm opacity-75 mt-0.5">{profile.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="bg-white/20 text-on-primary text-xs font-bold px-3 py-0.5 rounded-full">
                                            {roleName(profile.role_level)}
                                        </span>
                                        {profile.no_hp && (
                                            <span className="bg-white/10 text-on-primary text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">phone</span>
                                                {profile.no_hp}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ═══ POSYANDU SECTION (Kader Only) ═══ */}
                        {profile.role_level === 1 && (
                        <div className="bg-surface border border-outline-variant/50 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-5 py-4 bg-surface-container-lowest border-b border-outline-variant/30 flex items-center justify-between">
                                <h3 className="font-title-md font-bold text-on-surface flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[22px]">home_work</span>
                                    Posyandu Tempat Bertugas
                                    <span className="ml-1 bg-primary text-on-primary text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                        {profile.posyandu_list?.length || 0}
                                    </span>
                                </h3>
                                {unassigned.length > 0 && (
                                    <button
                                        onClick={() => setShowAddPosyandu(!showAddPosyandu)}
                                        className="text-primary text-sm font-bold flex items-center gap-1 hover:bg-primary-container/30 px-2 py-1 rounded-lg transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            {showAddPosyandu ? 'close' : 'add'}
                                        </span>
                                        {showAddPosyandu ? 'Batal' : 'Tambah'}
                                    </button>
                                )}
                            </div>

                            {/* Add Posyandu Panel */}
                            {showAddPosyandu && unassigned.length > 0 && (
                                <div className="px-5 py-4 bg-primary-container/10 border-b border-outline-variant/30 flex items-center gap-3">
                                    <select
                                        value={selectedPosyanduId}
                                        onChange={e => setSelectedPosyanduId(e.target.value)}
                                        className="flex-1 bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-all"
                                    >
                                        <option value="">— Pilih Posyandu —</option>
                                        {unassigned.map(p => (
                                            <option key={p.id} value={p.id}>{p.nama} ({p.alamat})</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleAssignPosyandu}
                                        disabled={!selectedPosyanduId || addingPosyandu}
                                        className="px-4 py-2.5 bg-primary text-on-primary font-bold text-sm rounded-xl disabled:opacity-50 hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1 whitespace-nowrap"
                                    >
                                        {addingPosyandu
                                            ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                                            : <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                        }
                                        Tambah
                                    </button>
                                </div>
                            )}

                            {/* Posyandu List */}
                            <div className="divide-y divide-outline-variant/20">
                                {(!profile.posyandu_list || profile.posyandu_list.length === 0) ? (
                                    <div className="px-5 py-8 text-center text-on-surface-variant">
                                        <span className="material-symbols-outlined text-3xl mb-2 block opacity-40">home_work</span>
                                        <p className="text-sm">Belum ada posyandu yang terdaftar.</p>
                                        <p className="text-xs mt-1 opacity-70">Klik "Tambah" untuk memilih posyandu.</p>
                                    </div>
                                ) : profile.posyandu_list.map((p) => (
                                    <div key={p.id} className="px-5 py-4 flex items-center gap-4 hover:bg-surface-container-lowest/50 transition-colors">
                                        {/* Icon + Badge */}
                                        <div className="relative">
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${p.is_primary ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                                                <span className="material-symbols-outlined text-[22px]">home_work</span>
                                            </div>
                                            {p.is_primary && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#f59e0b] rounded-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-white text-[10px]">star</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-title-sm font-bold text-on-surface">{p.nama}</p>
                                            {p.alamat && <p className="text-xs text-on-surface-variant mt-0.5 truncate">{p.alamat}</p>}
                                            {p.is_primary && (
                                                <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#b45309] bg-[#fef3c7] px-2 py-0.5 rounded-full">
                                                    <span className="material-symbols-outlined text-[10px]">star</span>
                                                    Posyandu Utama
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-1 shrink-0">
                                            {!p.is_primary && (
                                                <button
                                                    onClick={() => handleSetPrimary(p.id)}
                                                    title="Jadikan Posyandu Utama"
                                                    className="p-2 rounded-xl text-on-surface-variant hover:bg-[#fef3c7] hover:text-[#b45309] transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">star</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleRemovePosyandu(p.id)}
                                                title="Hapus dari daftar"
                                                className="p-2 rounded-xl text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        )}

                        {/* ═══ DESA SECTION (Bidan Only) ═══ */}
                        {profile.role_level === 2 && (
                        <div className="bg-surface border border-outline-variant/50 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-5 py-4 bg-surface-container-lowest border-b border-outline-variant/30">
                                <h3 className="font-title-md font-bold text-on-surface flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[22px]">holiday_village</span>
                                    Desa Penugasan Bidan
                                    <span className="ml-1 bg-primary text-on-primary text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                        {profile.desa_list?.length || 0}
                                    </span>
                                </h3>
                                <p className="text-xs text-on-surface-variant mt-1">Daftar desa wilayah binaan yang ditugaskan oleh Puskesmas.</p>
                            </div>
                            
                            <div className="divide-y divide-outline-variant/30">
                                {(!profile.desa_list || profile.desa_list.length === 0) ? (
                                    <div className="px-5 py-8 text-center text-on-surface-variant">
                                        <span className="material-symbols-outlined text-3xl mb-2 block opacity-40">location_off</span>
                                        <p className="text-sm">Belum ada desa penugasan.</p>
                                    </div>
                                ) : profile.desa_list.map((d) => (
                                    <div key={d.id} className="px-5 py-4 flex items-center gap-4 hover:bg-surface-container-lowest/50 transition-colors">
                                        <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center shrink-0 text-on-surface-variant">
                                            <span className="material-symbols-outlined text-[22px]">holiday_village</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-title-sm font-bold text-on-surface">{d.nama}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        )}

                        {/* ═══ WILAYAH CARD ═══ */}
                        <div className="bg-surface border border-outline-variant/50 rounded-2xl p-5 shadow-sm">
                            <h3 className="font-title-md font-bold text-on-surface flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-primary text-[22px]">location_on</span>
                                Wilayah Tugas
                            </h3>
                            <InfoItem icon="holiday_village"  label="Desa / Kelurahan"     value={profile.region_info?.desa} />
                            <InfoItem icon="location_city"    label="Kecamatan"             value={profile.region_info?.kecamatan} />
                            <InfoItem icon="local_hospital"   label="Kabupaten / Puskesmas" value={profile.region_info?.kabupaten} />
                            <InfoItem icon="map"              label="Provinsi"              value={profile.region_info?.provinsi} />
                            <p className="mt-3 text-[11px] text-on-surface-variant/60 italic">
                                * Wilayah tugas ditetapkan oleh Admin dan tidak dapat diubah secara mandiri.
                            </p>
                        </div>

                        {/* ═══ EDIT FORM ═══ */}
                        <div className="bg-surface border border-outline-variant/50 rounded-2xl p-5 shadow-sm">
                            <h3 className="font-title-md font-bold text-on-surface flex items-center gap-2 mb-5">
                                <span className="material-symbols-outlined text-primary text-[22px]">manage_accounts</span>
                                Edit Informasi Pribadi
                            </h3>

                            {msg && (
                                <div className={`flex items-start gap-3 p-4 rounded-xl mb-5 text-sm font-medium ${
                                    msg.type === 'success' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-error-container text-on-error-container'
                                }`}>
                                    <span className="material-symbols-outlined text-[20px] shrink-0">
                                        {msg.type === 'success' ? 'check_circle' : 'error'}
                                    </span>
                                    {msg.text}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                                <div>
                                    <label className="block text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">Nama Lengkap *</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[20px]">person</span>
                                        <input type="text" name="name" required value={formData.name} onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Nama lengkap Anda" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">Nomor HP / WhatsApp</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[20px]">phone</span>
                                        <input type="tel" name="no_hp" value={formData.no_hp} onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="08xxxxxxxxxx" />
                                    </div>
                                </div>

                                {profile.role_level === 3 && (
                                <div>
                                    <label className="block text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">Puskesmas yang Dinaungi</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[20px]">local_hospital</span>
                                        <select name="puskesmas_id" value={formData.puskesmas_id} onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                        >
                                            <option value="">— Pilih Puskesmas —</option>
                                            {availablePuskesmas.map(p => (
                                                <option key={p.id} value={p.id}>{p.nama}</option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">expand_more</span>
                                    </div>
                                </div>
                                )}

                                <div className="border-t border-outline-variant/40 pt-4">
                                    <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-3">
                                        Ganti Password <span className="normal-case font-normal">(opsional)</span>
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[20px]">lock</span>
                                            <input type="password" name="password" value={formData.password} onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                                placeholder="Password baru" />
                                        </div>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[20px]">lock_reset</span>
                                            <input type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                                placeholder="Konfirmasi password baru" />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={saving}
                                    className="w-full py-3.5 bg-primary text-on-primary font-bold rounded-2xl shadow-md hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-60">
                                    {saving
                                        ? <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Menyimpan...</>
                                        : <><span className="material-symbols-outlined text-[18px]">save</span> Simpan Perubahan</>
                                    }
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
