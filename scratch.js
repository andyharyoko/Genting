const fs = require('fs');

let code = fs.readFileSync('webgis/src/pages/KaderDashboard.jsx', 'utf8');

// 1. Add "Laporan" to Desktop Sidebar
const desktopSidebarRegex = /<span className="material-symbols-outlined">child_care<\/span> Data Balita\s+<\/button>\s+<\/nav>/;
const desktopSidebarReplacement = `<span className="material-symbols-outlined">child_care</span> Data Balita
                    </button>
                    <button 
                        onClick={() => setActiveTab('laporan')} 
                        className={\`flex items-center gap-3 px-4 py-3 rounded-xl transition-all \${activeTab === 'laporan' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-surface-container'}\`}
                    >
                        <span className="material-symbols-outlined">summarize</span> Laporan
                    </button>
                </nav>`;
code = code.replace(desktopSidebarRegex, desktopSidebarReplacement);

// 2. Add "Laporan" to Mobile Drawer
const mobileDrawerRegex = /<span className="material-symbols-outlined">child_care<\/span>\s*Data Balita\s*<\/button>\s*<\/nav>/;
const mobileDrawerReplacement = `<span className="material-symbols-outlined">child_care</span>
                            Data Balita
                        </button>
                        <button onClick={() => {setActiveTab('laporan'); setIsDrawerOpen(false);}} className={\`flex items-center gap-3 py-3 px-4 rounded-xl transition-all \${activeTab === 'laporan' ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}\`}>
                            <span className="material-symbols-outlined">summarize</span>
                            Laporan
                        </button>
                    </nav>`;
code = code.replace(mobileDrawerRegex, mobileDrawerReplacement);

// 3. Update Header Title to support Laporan and add print:hidden to classes that shouldn't be printed
code = code.replace(
    /\{activeTab === 'anak' \? 'Data Anak \(KMS\)' : 'Aktivitas Terakhir'\}/,
    `{activeTab === 'anak' ? 'Data Anak (KMS)' : activeTab === 'laporan' ? 'Laporan Posyandu' : 'Aktivitas Terakhir'}`
);

// Add print:hidden to header
code = code.replace(
    /<section className="flex flex-col gap-1 mb-6">/,
    `<section className="flex flex-col gap-1 mb-6 print:hidden">`
);
code = code.replace(
    /<header className="md:hidden/,
    `<header className="print:hidden md:hidden`
);
code = code.replace(
    /<aside className="w-64/,
    `<aside className="print:hidden w-64`
);
code = code.replace(
    /\{data.pending_sync > 0 && \(/,
    `{data.pending_sync > 0 && activeTab !== 'laporan' && (`
);

// 4. Inject Laporan Tab UI
const laporanUI = `
                        {/* --- TAB LAPORAN --- */}
                        {activeTab === 'laporan' && (
                            <div className="flex flex-col gap-4 animate-fade-in-up">
                                <div className="print:hidden flex justify-between items-center bg-surface p-4 rounded-2xl border border-outline-variant/50 shadow-sm">
                                    <div className="flex items-center gap-3 text-on-surface-variant">
                                        <div className="bg-primary-container text-on-primary-container p-2 rounded-full flex">
                                            <span className="material-symbols-outlined">summarize</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-on-surface">Laporan Bulanan</p>
                                            <p className="text-sm">Ringkasan data balita dan pengukuran terakhir</p>
                                        </div>
                                    </div>
                                    <button onClick={() => window.print()} className="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm text-sm">
                                        <span className="material-symbols-outlined text-[18px]">print</span> Cetak Laporan
                                    </button>
                                </div>
                                
                                {/* Print Header (Only visible on print) */}
                                <div className="hidden print:block mb-6 text-center">
                                    <h1 className="text-2xl font-bold">LAPORAN POSYANDU</h1>
                                    <p className="text-sm mt-1">Kader: {data.user.name} | Lokasi: {data.user.lokasi}</p>
                                    <p className="text-sm mt-1">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="bg-surface p-4 rounded-xl border border-outline-variant/50 shadow-sm text-center">
                                        <h4 className="text-sm text-on-surface-variant font-bold">Total Balita</h4>
                                        <p className="text-2xl font-bold text-primary">{balitaList.length}</p>
                                    </div>
                                    <div className="bg-surface p-4 rounded-xl border border-outline-variant/50 shadow-sm text-center">
                                        <h4 className="text-sm text-on-surface-variant font-bold">Gizi Baik / Normal</h4>
                                        <p className="text-2xl font-bold text-success">
                                            {balitaList.filter(b => !b.status_gizi || b.status_gizi === 'NORMAL' || b.status_gizi === 'GIZI BAIK').length}
                                        </p>
                                    </div>
                                    <div className="bg-surface p-4 rounded-xl border border-outline-variant/50 shadow-sm text-center">
                                        <h4 className="text-sm text-on-surface-variant font-bold">Perlu Perhatian (Stunting/Kurang)</h4>
                                        <p className="text-2xl font-bold text-error">
                                            {balitaList.filter(b => b.status_gizi && b.status_gizi !== 'NORMAL' && b.status_gizi !== 'GIZI BAIK').length}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead>
                                            <tr className="bg-surface-container-low border-b border-outline-variant/50">
                                                <th className="py-2 px-3 font-bold">No</th>
                                                <th className="py-2 px-3 font-bold">Nama Balita</th>
                                                <th className="py-2 px-3 font-bold">Tgl Lahir</th>
                                                <th className="py-2 px-3 font-bold">Nama Ibu</th>
                                                <th className="py-2 px-3 font-bold">Pengukuran Terakhir</th>
                                                <th className="py-2 px-3 font-bold">BB (kg)</th>
                                                <th className="py-2 px-3 font-bold">TB (cm)</th>
                                                <th className="py-2 px-3 font-bold">Status Gizi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {balitaList.map((balita, idx) => (
                                                <tr key={balita.id} className="border-b border-outline-variant/30">
                                                    <td className="py-2 px-3">{idx + 1}</td>
                                                    <td className="py-2 px-3 font-bold">{balita.nama}</td>
                                                    <td className="py-2 px-3">{balita.tanggal_lahir}</td>
                                                    <td className="py-2 px-3">{balita.nama_ibu || '-'}</td>
                                                    <td className="py-2 px-3">{balita.tanggal_ukur_terakhir || '-'}</td>
                                                    <td className="py-2 px-3">{balita.berat_badan_terakhir || '-'}</td>
                                                    <td className="py-2 px-3">{balita.tinggi_badan_terakhir || '-'}</td>
                                                    <td className="py-2 px-3">
                                                        <span className={\`font-bold \${balita.status_gizi && balita.status_gizi.includes('STUNTED') ? 'text-error' : balita.status_gizi === 'NORMAL' ? 'text-success' : ''}\`}>
                                                            {balita.status_gizi || '-'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {balitaList.length === 0 && (
                                                <tr><td colSpan="8" className="py-4 text-center">Belum ada data</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
`;

code = code.replace(/<\/section>\s*<\/main>\s*<\/div>/, laporanUI + '\n                    </section>\n                </main>\n            </div>');

fs.writeFileSync('webgis/src/pages/KaderDashboard.jsx', code);
console.log('Script executed successfully!');
