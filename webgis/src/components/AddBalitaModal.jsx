import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000/api/v1';
const WILAYAH = 'https://www.emsifa.com/api-wilayah-indonesia/api';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

// Default: Jawa Timur (id=35), Kabupaten Tuban (id=3523)
const DEFAULT_PROV = '35';
const DEFAULT_KAB  = '3523';

const emptyForm = () => ({
    nik: '', nama: '', nama_ibu: '', tanggal_lahir: '',
    jenis_kelamin: 'L', alamat: '',
    kode_desa: '', provinsi_id: DEFAULT_PROV, kabupaten_id: DEFAULT_KAB, kecamatan_id: '',
    posyandu_id: '',
});

export default function AddBalitaModal({ isOpen, onClose, onSuccess, editData = null }) {
    const isEdit = !!editData;

    const [formData, setFormData]       = useState(emptyForm());
    const [regions, setRegions]         = useState({ provinsi: [], kabupaten: [], kecamatan: [], desa: [] });
    const [posyanduOptions, setPosyanduOptions] = useState([]);
    const [loading, setLoading]         = useState(false);
    const [initLoading, setInitLoading] = useState(false);
    const [errorMsg, setErrorMsg]       = useState('');

    // ── Fetch helpers ──────────────────────────────────────
    const fetchProvinsi    = async () => { const r = await axios.get(`${WILAYAH}/provinces.json`); return r.data; };
    const fetchKabupaten   = async (pId) => { const r = await axios.get(`${WILAYAH}/regencies/${pId}.json`); return r.data; };
    const fetchKecamatan   = async (kId) => { const r = await axios.get(`${WILAYAH}/districts/${kId}.json`); return r.data; };
    const fetchDesa        = async (kId) => { const r = await axios.get(`${WILAYAH}/villages/${kId}.json`); return r.data; };

    const fetchPosyanduOptions = async () => {
        try {
            const res = await axios.get(`${API}/profile`, { headers: authHeader() });
            const list = res.data.data?.posyandu_list || [];
            setPosyanduOptions(list);
            return list;
        } catch { return []; }
    };

    // ── Init on open ───────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;

        setErrorMsg('');
        setInitLoading(true);

        const init = async () => {
            try {
                const [provinsiList, posyanduList] = await Promise.all([
                    fetchProvinsi(),
                    fetchPosyanduOptions(),
                ]);

                const kabupatenList = await fetchKabupaten(DEFAULT_PROV);
                const defaultKecList = await fetchKecamatan(DEFAULT_KAB);

                // Seed regions
                setRegions({ provinsi: provinsiList, kabupaten: kabupatenList, kecamatan: defaultKecList, desa: [] });

                if (isEdit && editData) {
                    // MODE EDIT: fill form from editData
                    // kode_desa is the raw desa id; we need to figure out kecamatan from it
                    // Load kecamatan from default kabupaten first; if desa doesn't match we'll handle cascade
                    const provinsiId = DEFAULT_PROV; // force default prov/kab for simplicity
                    const kabupatenId = DEFAULT_KAB;
                    // Try to get kecamatan list for default kab or cascade logic if different
                    // For now we pre-loaded defaultKecList, we can just use it unless they have a different kabupaten
                    // (Assuming most edits will be in Tuban, if not, they can re-select)
                    
                    // We need to fetch desa if kecamatan is provided
                    let desaList = [];
                    let kecId = '';
                    if (editData.kode_desa) {
                        // We extract kecamatan id from desa id (usually first 7 chars for emsifa api)
                        kecId = editData.kode_desa.substring(0, 7);
                        desaList = await fetchDesa(kecId);
                        setRegions(prev => ({ ...prev, desa: desaList }));
                    }

                    setFormData({
                        nik:            '',
                        nama:           editData.nama || '',
                        nama_ibu:       editData.nama_ibu || '',
                        tanggal_lahir:  editData.tanggal_lahir || '',
                        jenis_kelamin:  editData.jk === 'Laki-laki' ? 'L' : 'P',
                        alamat:         editData.alamat || '',
                        kode_desa:      editData.kode_desa || '',
                        provinsi_id:    provinsiId,
                        kabupaten_id:   kabupatenId,
                        kecamatan_id:   kecId,
                        posyandu_id:    editData.posyandu_id ? String(editData.posyandu_id) : '',
                    });
                } else {
                    // MODE TAMBAH: default Jawa Timur + Tuban
                    const primary = posyanduList.find(p => p.is_primary);
                    setFormData({
                        ...emptyForm(),
                        posyandu_id: primary ? String(primary.id) : '',
                    });
                }
            } catch (e) {
                console.error('Init error', e);
            } finally {
                setInitLoading(false);
            }
        };

        init();
    }, [isOpen, editData]);

    // ── Cascade change ─────────────────────────────────────
    const handleChange = async (e) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const d = { ...prev, [name]: value };
            if (name === 'provinsi_id')  { d.kabupaten_id = ''; d.kecamatan_id = ''; d.kode_desa = ''; }
            if (name === 'kabupaten_id') { d.kecamatan_id = ''; d.kode_desa = ''; }
            if (name === 'kecamatan_id') { d.kode_desa = ''; }
            return d;
        });

        if (name === 'provinsi_id' && value) {
            const list = await fetchKabupaten(value);
            setRegions(prev => ({ ...prev, kabupaten: list, kecamatan: [], desa: [] }));
        }
        if (name === 'kabupaten_id' && value) {
            const list = await fetchKecamatan(value);
            setRegions(prev => ({ ...prev, kecamatan: list, desa: [] }));
        }
        if (name === 'kecamatan_id' && value) {
            const list = await fetchDesa(value);
            setRegions(prev => ({ ...prev, desa: list }));
        }
    };

    // ── Submit ─────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        const payload = {
            ...formData,
            posyandu_id: formData.posyandu_id ? parseInt(formData.posyandu_id) : null,
        };

        try {
            if (isEdit) {
                await axios.put(`${API}/balita/${editData.id}`, payload, { headers: authHeader() });
            } else {
                await axios.post(`${API}/balita`, payload, { headers: authHeader() });
            }
            onSuccess();
            onClose();
        } catch (err) {
            const errs = err.response?.data?.errors;
            setErrorMsg(errs ? Object.values(errs)[0][0] : (err.response?.data?.message || 'Gagal menyimpan data.'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputCls = "w-full bg-surface-container-low border border-outline-variant rounded-xl p-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm";
    const labelCls = "block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1.5";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-surface relative z-10 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">

                {/* Header */}
                <div className={`px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-gradient-to-r ${isEdit ? 'from-secondary/10' : 'from-primary/10'} to-transparent`}>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[22px]">{isEdit ? 'edit_note' : 'person_add'}</span>
                        <h2 className="font-headline-md text-primary font-bold">
                            {isEdit ? 'Edit Data Balita' : 'Pendaftaran Balita'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full material-symbols-outlined text-on-surface-variant transition-colors">close</button>
                </div>

                {initLoading ? (
                    <div className="flex items-center justify-center py-16 gap-3 text-primary">
                        <span className="material-symbols-outlined animate-spin text-3xl">sync</span>
                        <span className="text-sm">Memuat data...</span>
                    </div>
                ) : (
                    <div className="p-5 overflow-y-auto">
                        {errorMsg && (
                            <div className="bg-error-container text-on-error-container p-3 rounded-xl mb-4 text-sm flex items-start gap-2">
                                <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                                {errorMsg}
                            </div>
                        )}

                        <form id="addBalitaForm" onSubmit={handleSubmit} className="flex flex-col gap-4">

                            {/* Posyandu */}
                            <div>
                                <label className={labelCls}>Posyandu *</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 text-[18px] pointer-events-none">home_work</span>
                                    <select name="posyandu_id" value={formData.posyandu_id} onChange={handleChange} className={`${inputCls} pl-9`}>
                                        <option value="">— Pilih Posyandu —</option>
                                        {posyanduOptions.map(p => (
                                            <option key={p.id} value={p.id}>{p.nama}{p.is_primary ? ' ★' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="border-t border-outline-variant/30 pt-1">
                                <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-3">Data Anak</p>
                            </div>

                            {/* NIK + JK */}
                            {!isEdit && (
                                <div>
                                    <label className={labelCls}>NIK (Opsional)</label>
                                    <input type="text" name="nik" value={formData.nik} onChange={handleChange} className={inputCls} placeholder="16 digit NIK" />
                                </div>
                            )}

                            {/* Nama */}
                            <div>
                                <label className={labelCls}>Nama Lengkap Balita *</label>
                                <input type="text" name="nama" required value={formData.nama} onChange={handleChange} className={inputCls} placeholder="Nama sesuai dokumen" />
                            </div>

                            {/* Nama Ibu + Tgl Lahir */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Nama Ibu Kandung *</label>
                                    <input type="text" name="nama_ibu" required value={formData.nama_ibu} onChange={handleChange} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Tanggal Lahir *</label>
                                    <input type="date" name="tanggal_lahir" required value={formData.tanggal_lahir} onChange={handleChange} className={inputCls} />
                                </div>
                            </div>

                            {/* Jenis Kelamin */}
                            <div>
                                <label className={labelCls}>Jenis Kelamin *</label>
                                <div className="flex gap-3">
                                    {[['L', 'male', 'Laki-laki'], ['P', 'female', 'Perempuan']].map(([v, icon, label]) => (
                                        <label key={v} className={`flex-1 flex items-center justify-center gap-2 cursor-pointer py-3 rounded-xl border-2 transition-all text-sm font-semibold ${formData.jenis_kelamin === v ? 'border-primary bg-primary-container text-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary/40'}`}>
                                            <input type="radio" name="jenis_kelamin" value={v} checked={formData.jenis_kelamin === v} onChange={handleChange} className="hidden" />
                                            <span className="material-symbols-outlined text-[18px]">{icon}</span>
                                            {label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Alamat */}
                            <div className="border-t border-outline-variant/30 pt-1">
                                <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-3">Alamat Domisili</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Provinsi *</label>
                                    <select name="provinsi_id" required value={formData.provinsi_id} onChange={handleChange} className={inputCls}>
                                        <option value="">Pilih...</option>
                                        {regions.provinsi.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Kab./Kota *</label>
                                    <select name="kabupaten_id" required value={formData.kabupaten_id} onChange={handleChange} className={inputCls} disabled={!formData.provinsi_id}>
                                        <option value="">Pilih...</option>
                                        {regions.kabupaten.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Kecamatan *</label>
                                    <select name="kecamatan_id" required value={formData.kecamatan_id} onChange={handleChange} className={inputCls} disabled={!formData.kabupaten_id}>
                                        <option value="">Pilih...</option>
                                        {regions.kecamatan.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Desa/Kelurahan *</label>
                                    <select name="kode_desa" required value={formData.kode_desa} onChange={handleChange} className={inputCls} disabled={!formData.kecamatan_id}>
                                        <option value="">Pilih...</option>
                                        {regions.desa.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Jalan / RT RW</label>
                                <textarea name="alamat" value={formData.alamat} onChange={handleChange} rows="2" className={inputCls} placeholder="Cth: Jl. Melati No 3, RT 01 RW 02" />
                            </div>
                        </form>
                    </div>
                )}

                <div className="px-5 py-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-lowest">
                    <button onClick={onClose} className="px-5 py-2.5 font-label-sm text-primary hover:bg-primary-container/20 rounded-xl transition-colors">Batal</button>
                    <button form="addBalitaForm" type="submit" disabled={loading || initLoading}
                        className="px-6 py-2.5 bg-primary text-on-primary font-label-sm rounded-xl shadow-sm hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60">
                        {loading
                            ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                            : <span className="material-symbols-outlined text-[16px]">{isEdit ? 'update' : 'save'}</span>
                        }
                        {isEdit ? 'Simpan Perubahan' : 'Simpan Data'}
                    </button>
                </div>
            </div>
        </div>
    );
}
