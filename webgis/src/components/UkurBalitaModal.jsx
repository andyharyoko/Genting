import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function UkurBalitaModal({ isOpen, onClose, onSuccess, balita, editData = null }) {
    const [formData, setFormData] = useState({
        tanggal_ukur: new Date().toISOString().split('T')[0],
        berat_badan: '',
        tinggi_badan: '',
        posisi_ukur: 'Berdiri'
    });

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [lastMeasure, setLastMeasure] = useState(null);

    useEffect(() => {
        if (isOpen && balita) {
            if (editData) {
                setFormData({
                    tanggal_ukur: editData.tanggal_ukur || new Date().toISOString().split('T')[0],
                    berat_badan: editData.berat_badan || '',
                    tinggi_badan: editData.tinggi_badan || '',
                    posisi_ukur: editData.posisi_ukur || 'Berdiri'
                });
            } else {
                setFormData({
                    tanggal_ukur: new Date().toISOString().split('T')[0],
                    berat_badan: '',
                    tinggi_badan: '',
                    posisi_ukur: 'Berdiri'
                });
            }
            setErrorMsg('');
            
            // Fetch riwayat terakhir
            const fetchLast = async () => {
                try {
                    const token = localStorage.getItem('auth_token');
                    const res = await axios.get(`http://localhost:8000/api/v1/antropometri/balita/${balita.id}`, { headers: { Authorization: `Bearer ${token}` } });
                    if (res.data?.data?.length > 0) {
                        setLastMeasure(res.data.data[0]); // newest is first due to descending sort in backend
                    } else {
                        setLastMeasure(null);
                    }
                } catch (e) {
                    console.error("Failed to fetch last measure", e);
                }
            };
            fetchLast();
        }
    }, [isOpen, balita, editData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const token = localStorage.getItem('auth_token');
            if (editData) {
                await axios.put(`http://localhost:8000/api/v1/antropometri/${editData.id}`, {
                    ...formData
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('http://localhost:8000/api/v1/sync/antropometri', {
                    data: [{
                        id: crypto.randomUUID(),
                        balita_id: balita.id,
                        ...formData,
                        is_synced: 1
                    }]
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving data:', error);
            setErrorMsg(error.response?.data?.message || 'Gagal menyimpan data pengukuran. Pastikan backend server menyala.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !balita) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-surface relative z-10 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                    <h2 className="font-headline-md text-primary font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-[24px]">straighten</span>
                        {editData ? 'Edit Pengukuran' : 'Ukur Balita'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full material-symbols-outlined text-on-surface-variant">close</button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {errorMsg && (
                        <div className="bg-error-container text-on-error-container p-3 rounded-lg mb-4 text-sm">
                            {errorMsg}
                        </div>
                    )}
                    
                    <div className="bg-primary-container/20 rounded-xl p-4 mb-6 border border-primary/10">
                        <p className="text-xs text-on-surface-variant mb-1 uppercase tracking-wider font-bold">Informasi Balita</p>
                        <p className="font-title-md text-on-surface font-bold">{balita.nama}</p>
                        <div className="flex items-center gap-2 text-on-surface-variant text-sm mt-1">
                            <span className="material-symbols-outlined text-[16px]">cake</span>
                            <span>{balita.tanggal_lahir}</span>
                            <span className="mx-1">•</span>
                            <span>{balita.jk}</span>
                        </div>
                    </div>

                    {lastMeasure && !editData && (
                        <div className="bg-tertiary-container/20 rounded-xl p-4 mb-6 border border-tertiary/20">
                            <div className="text-[11px] font-bold text-tertiary uppercase tracking-wider flex items-center gap-1 mb-2">
                                <span className="material-symbols-outlined text-[14px]">history</span>
                                Pengukuran Sebelumnya ({lastMeasure.tanggal_ukur})
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-sm text-on-surface bg-surface p-3 rounded-lg border border-outline-variant/30">
                                <div><span className="text-on-surface-variant text-[10px] block uppercase font-bold">Berat (BB)</span><span className="font-medium">{lastMeasure.berat_badan} kg</span></div>
                                <div><span className="text-on-surface-variant text-[10px] block uppercase font-bold">Tinggi (TB)</span><span className="font-medium">{lastMeasure.tinggi_badan} cm</span></div>
                                <div><span className="text-on-surface-variant text-[10px] block uppercase font-bold">Status WAZ</span><span className="font-bold text-xs py-0.5 px-2 bg-primary/10 rounded-full inline-block mt-1">{lastMeasure.z_score_wfa} SD</span></div>
                                <div><span className="text-on-surface-variant text-[10px] block uppercase font-bold">Status HAZ</span><span className="font-bold text-xs py-0.5 px-2 bg-primary/10 rounded-full inline-block mt-1">{lastMeasure.z_score_hfa} SD</span></div>
                            </div>
                        </div>
                    )}

                    <form id="ukurBalitaForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
                        
                        <div>
                            <label className="block font-label-sm text-on-surface mb-1">Tanggal Ukur *</label>
                            <input type="date" name="tanggal_ukur" required value={formData.tanggal_ukur} onChange={handleChange} disabled={!!editData} className={`w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 outline-none focus:border-primary ${editData ? 'opacity-50 cursor-not-allowed' : ''}`} />
                            {editData && <p className="text-[10px] text-on-surface-variant mt-1 italic">Tanggal pengukuran tidak dapat diubah saat mode edit.</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-label-sm text-on-surface mb-1">Berat Badan (kg) *</label>
                                <input type="number" step="0.1" min="0" name="berat_badan" required value={formData.berat_badan} onChange={handleChange} className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 outline-none focus:border-primary" placeholder="Cth: 10.5" />
                            </div>
                            <div>
                                <label className="block font-label-sm text-on-surface mb-1">Tinggi Badan (cm) *</label>
                                <input type="number" step="0.1" min="0" name="tinggi_badan" required value={formData.tinggi_badan} onChange={handleChange} className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 outline-none focus:border-primary" placeholder="Cth: 80.2" />
                            </div>
                        </div>

                        <div className="mt-2">
                            <label className="block font-label-sm text-on-surface mb-2">Posisi Pengukuran Tinggi / Panjang Badan *</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer p-3 bg-surface-container-low border border-outline-variant rounded-lg flex-1 hover:border-primary transition-colors">
                                    <input type="radio" name="posisi_ukur" value="Berdiri" checked={formData.posisi_ukur === 'Berdiri'} onChange={handleChange} className="w-4 h-4 text-primary" />
                                    <span className="font-body-sm text-on-surface">Berdiri</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer p-3 bg-surface-container-low border border-outline-variant rounded-lg flex-1 hover:border-primary transition-colors">
                                    <input type="radio" name="posisi_ukur" value="Terlentang" checked={formData.posisi_ukur === 'Terlentang'} onChange={handleChange} className="w-4 h-4 text-primary" />
                                    <span className="font-body-sm text-on-surface">Terlentang</span>
                                </label>
                            </div>
                        </div>

                    </form>
                </div>
                
                <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-lowest">
                    <button onClick={onClose} className="px-4 py-2 font-label-sm text-primary hover:bg-primary-container/20 rounded-full transition-colors">Batal</button>
                    <button form="ukurBalitaForm" type="submit" disabled={loading} className="px-6 py-2 bg-primary text-on-primary font-label-sm rounded-full shadow-sm hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all flex items-center gap-2">
                        {loading ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">save</span>}
                        Simpan Data
                    </button>
                </div>
            </div>
        </div>
    );
}
