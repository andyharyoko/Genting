const fs = require('fs');

let code = fs.readFileSync('webgis/src/pages/KabupatenDashboard.jsx', 'utf8');

// 1. Rename to KabupatenDashboard is already done by my previous bash sed
// Wait, I didn't run sed, I used replace but let's check
if (!code.includes('KabupatenDashboard')) {
    code = code.replace(/PuskesmasDashboard/g, 'KabupatenDashboard');
}

// 2. Add 'admin-puskesmas' endpoints to fetchData
const fetchRegex = /axios\.get\('http:\/\/localhost:8000\/api\/v1\/posyandu', \{ headers \}\)/;
code = code.replace(fetchRegex, `axios.get('http://localhost:8000/api/v1/posyandu', { headers }),
                axios.get('http://localhost:8000/api/v1/admin-puskesmas', { headers })`);

const promiseAllRegex = /const \[dashRes, balitaRes, kaderRes, bidanRes, posyanduRes\] = await Promise\.all\(\[/;
code = code.replace(promiseAllRegex, `const [dashRes, balitaRes, kaderRes, bidanRes, posyanduRes, adminPuskesmasRes] = await Promise.all([`);

const setPosyanduRegex = /setPosyanduList\(posyanduRes\.data\.data\);/;
code = code.replace(setPosyanduRegex, `setPosyanduList(posyanduRes.data.data);\n            setAdminPuskesmasList(adminPuskesmasRes.data.data);`);

// 3. Fix user info display
code = code.replace(/Admin Puskesmas/g, 'Admin Kabupaten');
code = code.replace(/data\.user\.puskesmas_nama \? \`Puskesmas \$\{data\.user\.puskesmas_nama\.replace\('Puskesmas ', ''\)\}\` : 'Belum ditugaskan ke Puskesmas'/g, 'data.user.kabupaten_id ? `Dinkes Kab. Tuban` : `Admin Kabupaten`');

// 4. Change default tab to puskesmas
code = code.replace(/const \[activeTab, setActiveTab\] = useState\('posyandu'\);/, "const [activeTab, setActiveTab] = useState('puskesmas');");

// 5. Allow enabling puskesmas dropdowns
// For Posyandu Form
code = code.replace(
    /disabled\s*className="w-full pl-9 pr-4 py-2\.5 bg-surface-variant text-on-surface-variant border border-outline-variant rounded-xl appearance-none outline-none cursor-not-allowed opacity-70"/g,
    `className="w-full pl-9 pr-4 py-2.5 bg-surface border border-outline-variant rounded-xl appearance-none outline-none focus:border-primary transition-colors"`
);
// For Kader Form (wait, Kader form has specific styling)
code = code.replace(
    /disabled\s*className="w-full pl-9 pr-4 py-2\.5 border border-outline-variant rounded-xl appearance-none outline-none focus:border-primary transition-colors bg-surface-variant text-on-surface-variant opacity-70 cursor-not-allowed"/g,
    `className="w-full pl-9 pr-4 py-2.5 bg-surface border border-outline-variant rounded-xl appearance-none outline-none focus:border-primary transition-colors"`
);

// Allow editing puskesmas_id
// We must add onChange to the puskesmas_id selects.
// kaderForm
code = code.replace(
    /<select\s*value=\{kaderForm\.puskesmas_id\}/g,
    `<select value={kaderForm.puskesmas_id} onChange={e => setKaderForm({...kaderForm, puskesmas_id: e.target.value})}`
);
// posyanduForm
code = code.replace(
    /<select\s*value=\{posyanduForm\.puskesmas_id\}/g,
    `<select value={posyanduForm.puskesmas_id} onChange={e => setPosyanduForm({...posyanduForm, puskesmas_id: e.target.value})}`
);

// We need to inject the admin puskesmas CRUD functions and UI
const crudFns = `
    // --- ADMIN PUSKESMAS CRUD ---
    const handleSaveAdminPuskesmas = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('auth_token');
            if (editAdminPuskesmasId) {
                await axios.put(\`http://localhost:8000/api/v1/admin-puskesmas/\${editAdminPuskesmasId}\`, adminPuskesmasForm, { headers: { Authorization: \`Bearer \${token}\` } });
            } else {
                await axios.post('http://localhost:8000/api/v1/admin-puskesmas', adminPuskesmasForm, { headers: { Authorization: \`Bearer \${token}\` } });
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
            await axios.delete(\`http://localhost:8000/api/v1/admin-puskesmas/\${id}\`, { headers: { Authorization: \`Bearer \${token}\` } });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menghapus Admin Puskesmas');
        }
    };
`;
code = code.replace('// --- POSYANDU CRUD ---', crudFns + '\n    // --- POSYANDU CRUD ---');

// UI for Admin Puskesmas Tab
const adminPuskesmasUI = `
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
`;

// Replace the old Puskesmas Tab UI completely
code = code.replace(/\{\/\* --- TAB PUSKESMAS --- \*\/\}.*?\{\/\* --- TAB POSYANDU --- \*\/\}/s, adminPuskesmasUI + '\n                        {/* --- TAB POSYANDU --- */}');

// Add Admin Puskesmas Modal
const adminPuskesmasModalUI = `
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
`;

code = code.replace('{/* --- BIDAN MODAL --- */}', adminPuskesmasModalUI + '\n            {/* --- BIDAN MODAL --- */}');

fs.writeFileSync('webgis/src/pages/KabupatenDashboard.jsx', code);
