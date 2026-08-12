import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function RiwayatBalitaModal({ isOpen, onClose, balita, onEdit }) {
    const [riwayat, setRiwayat] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [evaluasiUtama, setEvaluasiUtama] = useState(null);
    const [showRules, setShowRules] = useState(false);
    const [selectedKesimpulan, setSelectedKesimpulan] = useState(null);

    // Estimasi sederhana WHO Median untuk Usia Ekivalen (Bulan 0 - 60)
    const whoMedian = {
        L: {
            weight: [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6, 9.9, 10.1, 10.3, 10.5, 10.7, 10.9, 11.1, 11.3, 11.5, 11.8, 12.0, 12.2, 12.4, 12.5, 12.7, 12.9, 13.1, 13.3, 13.5, 13.7, 13.8, 14.0, 14.2, 14.3, 14.5, 14.7, 14.8, 15.0, 15.2, 15.3, 15.5, 15.7, 15.8, 16.0, 16.2, 16.3, 16.5, 16.7, 16.8, 17.0, 17.2, 17.3, 17.5, 17.7, 17.8, 18.0, 18.2, 18.3],
            height: [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7, 76.9, 78.0, 79.1, 80.2, 81.2, 82.3, 83.2, 84.2, 85.1, 86.0, 86.9, 87.1, 88.0, 88.9, 89.8, 90.6, 91.4, 92.2, 93.0, 93.8, 94.5, 95.3, 96.1, 96.8, 97.6, 98.3, 99.0, 99.7, 100.4, 101.1, 101.8, 102.5, 103.2, 103.9, 104.6, 105.3, 105.9, 106.6, 107.3, 108.0, 108.6, 109.3, 110.0, 110.6, 111.3, 111.9, 112.6, 113.2]
        },
        P: {
            weight: [3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.7, 8.9, 9.2, 9.4, 9.6, 9.8, 10.0, 10.2, 10.4, 10.6, 10.9, 11.1, 11.3, 11.5, 11.7, 11.9, 12.1, 12.3, 12.5, 12.7, 12.9, 13.1, 13.3, 13.5, 13.7, 13.9, 14.0, 14.2, 14.4, 14.6, 14.8, 15.0, 15.2, 15.3, 15.5, 15.7, 15.9, 16.1, 16.3, 16.5, 16.7, 16.9, 17.1, 17.3, 17.5, 17.7, 17.9, 18.1, 18.3, 18.5],
            height: [49.1, 53.7, 57.1, 59.8, 62.1, 64.0, 65.7, 67.3, 68.7, 70.1, 71.5, 72.8, 74.0, 75.2, 76.4, 77.5, 78.6, 79.7, 80.7, 81.7, 82.7, 83.7, 84.6, 85.5, 85.7, 86.6, 87.4, 88.3, 89.1, 89.9, 90.7, 91.5, 92.2, 93.0, 93.8, 94.5, 95.2, 96.0, 96.7, 97.4, 98.1, 98.8, 99.5, 100.2, 100.9, 101.6, 102.3, 102.9, 103.6, 104.3, 105.0, 105.6, 106.3, 106.9, 107.6, 108.2, 108.9, 109.5, 110.1, 110.8, 111.4]
        }
    };

    const getAgeEquivalent = (val, type, jk) => {
        const arr = whoMedian[jk === 'Laki-laki' ? 'L' : 'P'][type];
        let closestAge = 0;
        let minDiff = Infinity;
        for (let i = 0; i < arr.length; i++) {
            const diff = Math.abs(arr[i] - val);
            if (diff < minDiff) {
                minDiff = diff;
                closestAge = i;
            }
        }
        return closestAge;
    };

    const calculateAgeMonths = (birthDate, measureDate) => {
        const b = new Date(birthDate);
        const m = new Date(measureDate);
        return (m.getFullYear() - b.getFullYear()) * 12 + (m.getMonth() - b.getMonth());
    };

    useEffect(() => {
        if (isOpen && balita) {
            fetchRiwayat();
        }
    }, [isOpen, balita]);

    const fetchRiwayat = useCallback(async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const token = localStorage.getItem('auth_token');
            const response = await axios.get(`http://localhost:8000/api/v1/balita/${balita.id}/riwayat`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const data = response.data.data || [];
            
            // Format data for chart (reverse so oldest is first)
            const sortedData = [...data].reverse();
            
            setRiwayat(sortedData);
            
            // Get evaluation from the most recent measurement (first item in the original API array)
            if (data.length > 0 && data[0].evaluasi) {
                setEvaluasiUtama(data[0].evaluasi);
            } else {
                setEvaluasiUtama(null);
            }
            
        } catch (error) {
            console.error('Error fetching riwayat:', error);
            setErrorMsg('Gagal mengambil data riwayat. Pastikan backend server menyala.');
        } finally {
            setLoading(false);
        }
    }, [balita]);

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus data pengukuran ini?')) return;
        
        try {
            const token = localStorage.getItem('auth_token');
            await axios.delete(`http://localhost:8000/api/v1/antropometri/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRiwayat();
        } catch (error) {
            console.error('Error deleting data:', error);
            setErrorMsg('Gagal menghapus data.');
        }
    };

    if (!isOpen || !balita) return null;

    // Custom Tooltip for Recharts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-surface p-3 rounded-lg border border-outline-variant shadow-lg text-sm">
                    <p className="font-bold text-on-surface mb-2 border-b border-outline-variant pb-1">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="font-medium flex justify-between gap-4">
                            <span>{entry.name}:</span>
                            <span>{entry.value} SD</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 z-[100] bg-surface flex flex-col overflow-hidden animate-fade-in-up">
                
                <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                    <div>
                        <h2 className="font-headline-md text-primary font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-[24px]">monitoring</span>
                            Riwayat & Evaluasi KMS
                        </h2>
                        <p className="text-sm text-on-surface-variant mt-1">
                            <span className="font-bold text-on-surface">{balita.nama}</span> • {balita.tanggal_lahir}
                        </p>
                    </div>
                    
                    <button onClick={onClose} className="px-4 py-2 bg-surface-variant hover:bg-surface-container-high text-on-surface-variant font-label-md rounded-full flex items-center gap-2 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Kembali
                    </button>
                </div>
                    
                    {/* Modal Kesimpulan Medis */}
                    {selectedKesimpulan && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedKesimpulan(null)} />
                            <div className="bg-surface relative z-10 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-tertiary/20">
                                <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-tertiary/10">
                                    <h2 className="font-headline-md text-tertiary font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined">health_and_safety</span>
                                        Kesimpulan Medis
                                    </h2>
                                    <button onClick={() => setSelectedKesimpulan(null)} className="p-2 hover:bg-surface-variant rounded-full material-symbols-outlined text-on-surface-variant transition-colors">close</button>
                                </div>
                                <div className="p-6 overflow-y-auto max-h-[70vh] text-sm text-on-surface">
                                    <p className="mb-4 text-on-surface-variant leading-relaxed">
                                        Hasil pengukuran anak pada tanggal <strong className="text-on-surface">{selectedKesimpulan.tanggal_ukur}</strong> mencatat Berat Badan <strong className="text-on-surface">{selectedKesimpulan.berat_badan} kg</strong> dan Tinggi Badan <strong className="text-on-surface">{selectedKesimpulan.tinggi_badan} cm</strong>.
                                    </p>
                                    
                                    <div className="space-y-3 mb-6">
                                        <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/50">
                                            <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Indikator Berat Badan (WAZ)</div>
                                            <div className="font-medium flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${selectedKesimpulan.z_score_wfa < -2 ? 'bg-error' : 'bg-primary'}`}></span>
                                                {selectedKesimpulan.z_score_wfa < -3 ? 'Sangat Kurang (Severely Underweight). Butuh rujukan segera.' :
                                                 selectedKesimpulan.z_score_wfa < -2 ? 'Kurang (Underweight). Perlu intervensi gizi.' :
                                                 selectedKesimpulan.z_score_wfa <= 1 ? 'Normal.' :
                                                 'Risiko Berat Badan Lebih.'}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/50">
                                            <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Indikator Tinggi Badan (HAZ)</div>
                                            <div className="font-medium flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${selectedKesimpulan.z_score_hfa < -2 ? 'bg-error' : 'bg-primary'}`}></span>
                                                {selectedKesimpulan.z_score_hfa < -3 ? 'Sangat Pendek (Severely Stunted). Status gizi kronis darurat.' :
                                                 selectedKesimpulan.z_score_hfa < -2 ? 'Pendek (Stunted). Perlu pemantauan ketat.' :
                                                 selectedKesimpulan.z_score_hfa <= 3 ? 'Normal.' :
                                                 'Tinggi.'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className={`p-4 rounded-xl border mb-4 ${selectedKesimpulan.z_score_wfa < -2 || selectedKesimpulan.z_score_hfa < -2 ? 'bg-error-container/50 border-error/20 text-on-error-container' : 'bg-primary-container/50 border-primary/20 text-on-primary-container'}`}>
                                        <strong className="block mb-1">Kesimpulan Akhir:</strong>
                                        {selectedKesimpulan.z_score_wfa < -2 || selectedKesimpulan.z_score_hfa < -2 
                                            ? "Anak memerlukan perhatian khusus karena salah satu atau kedua indikator berada di bawah normal. Harap evaluasi asupan kalori dan protein harian, serta jadwalkan konsultasi dengan tenaga kesehatan setempat."
                                            : "Tumbuh kembang anak berada dalam jalur yang baik. Pertahankan pola asuh dan nutrisi gizi seimbang yang diberikan."}
                                    </div>

                                    <div className="p-4 rounded-xl border border-tertiary/20 bg-surface-container text-on-surface-variant text-[13px] leading-relaxed">
                                        <div className="font-bold text-tertiary mb-3 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">child_care</span>
                                            Evaluasi Usia Ekivalen
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between border-b border-outline-variant/30 pb-1">
                                                <span>Usia Anak Saat Pengukuran:</span>
                                                <strong className="text-on-surface">{calculateAgeMonths(balita.tanggal_lahir, selectedKesimpulan.tanggal_ukur)} Bulan</strong>
                                            </div>
                                            <div className="flex justify-between border-b border-outline-variant/30 pb-1">
                                                <span>BB Terukur ({selectedKesimpulan.berat_badan} kg) setara anak usia:</span>
                                                <strong className="text-on-surface">{getAgeEquivalent(selectedKesimpulan.berat_badan, 'weight', balita.jenis_kelamin)} Bulan</strong>
                                            </div>
                                            <div className="flex justify-between pb-1">
                                                <span>TB Terukur ({selectedKesimpulan.tinggi_badan} cm) setara anak usia:</span>
                                                <strong className="text-on-surface">{getAgeEquivalent(selectedKesimpulan.tinggi_badan, 'height', balita.jenis_kelamin)} Bulan</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-5 py-3 border-t border-outline-variant bg-surface-container-lowest text-right">
                                    <button onClick={() => setSelectedKesimpulan(null)} className="px-5 py-2 font-label-sm text-tertiary hover:bg-tertiary-container/20 rounded-xl transition-colors">Tutup</button>
                                </div>
                            </div>
                        </div>
                    )}

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto bg-surface-container-lowest p-4 md:p-8 flex flex-col gap-8 custom-scrollbar">
                    
                    {errorMsg && (
                        <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm">
                            {errorMsg}
                        </div>
                    )}
                    
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-primary">
                            <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
                            <p className="font-label-md">Memuat Data Riwayat...</p>
                        </div>
                    ) : (
                        <>
                            {/* Evaluasi Aturan Emas Section */}
                            {evaluasiUtama && (
                                <div className="bg-tertiary-container/30 border border-tertiary/20 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                                    <div className="w-12 h-12 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-[28px]">stars</span>
                                    </div>
                                    <div>
                                        <h3 className="font-title-md font-bold text-tertiary mb-1">Evaluasi Aturan Emas (Usia Ekivalen)</h3>
                                        <p className="text-on-surface font-body-sm leading-relaxed">{evaluasiUtama}</p>
                                    </div>
                                </div>
                            )}

                            {/* Chart Section */}
                            {riwayat.length > 0 ? (
                                <div className="bg-surface border border-outline-variant/50 rounded-2xl p-5 shadow-sm">
                                    <h3 className="font-title-md font-bold text-on-surface mb-6 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">show_chart</span>
                                        Grafik Pertumbuhan Z-Score (WHO)
                                    </h3>
                                    
                                    <div className="h-[300px] w-full mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart
                                                data={riwayat}
                                                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                                <XAxis 
                                                    dataKey="tanggal_ukur" 
                                                    tick={{fontSize: 12, fill: '#5f6368'}} 
                                                    tickMargin={10} 
                                                    axisLine={{stroke: '#dadce0'}}
                                                />
                                                <YAxis 
                                                    domain={[-4, 4]} 
                                                    ticks={[-3, -2, -1, 0, 1, 2, 3]}
                                                    tick={{fontSize: 12, fill: '#5f6368'}} 
                                                    axisLine={false}
                                                />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                                
                                                {/* Reference Zones for Standard Deviations */}
                                                <ReferenceLine y={0} stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" />
                                                <ReferenceLine y={-2} stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 3" />
                                                <ReferenceLine y={-3} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" />

                                                {/* Line for WAZ (Weight for Age) */}
                                                <Line 
                                                    type="monotone" 
                                                    name="Berat Badan (WAZ)"
                                                    dataKey="z_score_wfa" 
                                                    stroke="#2563eb" 
                                                    strokeWidth={3}
                                                    dot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} 
                                                    activeDot={{ r: 7 }} 
                                                />
                                                {/* Line for HAZ (Height for Age) */}
                                                <Line 
                                                    type="monotone" 
                                                    name="Tinggi Badan (HAZ)"
                                                    dataKey="z_score_hfa" 
                                                    stroke="#059669" 
                                                    strokeWidth={3}
                                                    dot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: '#fff' }} 
                                                    activeDot={{ r: 7 }} 
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex justify-center mt-4 gap-6 text-xs text-on-surface-variant font-medium">
                                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#10b981]"></span> Median (0 SD)</div>
                                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#f59e0b]"></span> Garis Peringatan (-2 SD)</div>
                                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#ef4444]"></span> Garis Bahaya (-3 SD)</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-surface-container text-center py-10 rounded-2xl border border-outline-variant/50">
                                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">hourglass_empty</span>
                                    <p className="text-on-surface-variant">Belum ada data riwayat pengukuran untuk balita ini.</p>
                                </div>
                            )}

                            {/* History Table */}
                            {riwayat.length > 0 && (
                                <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-outline-variant/50 bg-surface-container-lowest">
                                        <h3 className="font-title-md font-bold text-on-surface flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">history</span>
                                            Tabel Riwayat Pengukuran
                                        </h3>
                                    </div>
                                    <div className="overflow-auto max-h-[500px] custom-scrollbar border-t border-outline-variant/30">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="sticky top-0 z-10 bg-surface-container-low shadow-sm">
                                                <tr>
                                                    <th className="py-3 px-5 font-label-sm text-on-surface-variant font-bold whitespace-nowrap border-b border-outline-variant/50">Tanggal Ukur</th>
                                                    <th className="py-3 px-5 font-label-sm text-on-surface-variant font-bold whitespace-nowrap border-b border-outline-variant/50">Tinggi (cm)</th>
                                                    <th className="py-3 px-5 font-label-sm text-on-surface-variant font-bold whitespace-nowrap border-b border-outline-variant/50">Berat (kg)</th>
                                                    <th className="py-3 px-5 font-label-sm text-on-surface-variant font-bold whitespace-nowrap border-b border-outline-variant/50">
                                                        WAZ 
                                                        <button onClick={() => setShowRules(true)} className="ml-1 text-primary hover:text-primary/80" title="Lihat Aturan WHO"><span className="material-symbols-outlined text-[14px] align-middle">info</span></button>
                                                    </th>
                                                    <th className="py-3 px-5 font-label-sm text-on-surface-variant font-bold whitespace-nowrap border-b border-outline-variant/50">
                                                        HAZ
                                                        <button onClick={() => setShowRules(true)} className="ml-1 text-primary hover:text-primary/80" title="Lihat Aturan WHO"><span className="material-symbols-outlined text-[14px] align-middle">info</span></button>
                                                    </th>
                                                    <th className="py-3 px-5 font-label-sm text-on-surface-variant font-bold whitespace-nowrap border-b border-outline-variant/50">Status Gizi</th>
                                                    <th className="py-3 px-5 font-label-sm text-on-surface-variant font-bold whitespace-nowrap border-b border-outline-variant/50 bg-surface-container-low right-0 sticky">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* Re-reverse for table to show newest first */}
                                                {[...riwayat].reverse().map((item, idx) => (
                                                    <tr key={idx} className="border-b border-outline-variant/30 hover:bg-surface-container-lowest transition-colors">
                                                        <td className="py-3 px-5 text-on-surface font-body-sm whitespace-nowrap font-medium">{item.tanggal_ukur}</td>
                                                        <td className="py-3 px-5 text-on-surface font-body-sm">{item.tinggi_badan}</td>
                                                        <td className="py-3 px-5 text-on-surface font-body-sm">{item.berat_badan}</td>
                                                        <td className="py-3 px-5 font-body-sm">
                                                            <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                                                                item.z_score_wfa < -3 ? 'bg-error-container text-on-error-container' :
                                                                item.z_score_wfa < -2 ? 'bg-[#fef3c7] text-[#b45309]' :
                                                                'bg-primary-container text-on-primary-container'
                                                            }`}>
                                                                {item.z_score_wfa} SD
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-5 font-body-sm">
                                                            <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                                                                item.z_score_hfa < -3 ? 'bg-error-container text-on-error-container' :
                                                                item.z_score_hfa < -2 ? 'bg-[#fef3c7] text-[#b45309]' :
                                                                'bg-primary-container text-on-primary-container'
                                                            }`}>
                                                                {item.z_score_hfa} SD
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-5 font-body-sm">
                                                            <span className="font-medium text-on-surface">{item.status_gizi}</span>
                                                        </td>
                                                        <td className="py-3 px-5 font-body-sm whitespace-nowrap bg-surface right-0 sticky border-l border-outline-variant/10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                                                            <div className="flex gap-2">
                                                                <button onClick={() => setSelectedKesimpulan(item)} className="p-1.5 bg-tertiary-container text-on-tertiary-container rounded hover:bg-tertiary hover:text-on-tertiary transition-colors flex items-center justify-center" title="Kesimpulan Medis">
                                                                    <span className="material-symbols-outlined text-[16px]">summarize</span>
                                                                </button>
                                                                <button onClick={() => onEdit && onEdit(item)} className="p-1.5 bg-primary-container text-on-primary-container rounded hover:bg-primary hover:text-on-primary transition-colors flex items-center justify-center" title="Edit">
                                                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                                                </button>
                                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-error-container text-on-error-container rounded hover:bg-error hover:text-on-error transition-colors flex items-center justify-center" title="Hapus">
                                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </>
                    )}
                </div>
            </div>
    );
}
