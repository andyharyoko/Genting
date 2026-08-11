import 'package:flutter/material.dart';
import 'grafik_kms_page.dart';
import 'input_antropometri_page.dart';
import '../database/database_helper.dart';
import '../services/api_service.dart';

class RiwayatKmsPage extends StatefulWidget {
  final Map<String, dynamic>? balita;
  
  const RiwayatKmsPage({super.key, this.balita});

  @override
  State<RiwayatKmsPage> createState() => _RiwayatKmsPageState();
}

class _RiwayatKmsPageState extends State<RiwayatKmsPage> {
  List<Map<String, dynamic>> riwayat = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => isLoading = true);
    
    String nik = widget.balita?['nik'] ?? '';
    String balitaId = (nik.isEmpty || nik == '-') ? (widget.balita?['id'] ?? '') : nik;
    
    final drafts = await DatabaseHelper().getAntropometriByBalita(balitaId);
    
    setState(() {
      riwayat = drafts.map((row) {
        String umurStr = widget.balita?['umur'] ?? 'Balita';
        if (widget.balita != null && widget.balita!['tanggal_lahir'] != null) {
          try {
            DateTime tglLahir = DateTime.parse(widget.balita!['tanggal_lahir']);
            DateTime tglUkur = DateTime.parse(row['tanggal_ukur']);
            int months = (tglUkur.year - tglLahir.year) * 12 + tglUkur.month - tglLahir.month;
            if (tglUkur.day < tglLahir.day) months--;
            if (months < 0) months = 0;
            umurStr = '$months Bulan';
          } catch (e) {
             // Fallback
          }
        }

        return {
          'id': row['id'],
          'tanggal_ukur': row['tanggal_ukur'],
          'tanggal': row['tanggal_ukur'],
          'umur': umurStr,
          'bb': row['berat_badan'],
          'tb': row['tinggi_badan'],
          'zscore_bb': row['z_score']?.toString() ?? 'Tunda Sync', // Baca riil
          'status': row['status_gizi'] ?? 'Lokal',
          'evaluasi': row['evaluasi'],
          'color': row['z_score'] == null ? Colors.blue : (row['z_score'] < -2 ? Colors.red : Colors.green),
        };
      }).toList();
      isLoading = false;
    });
  }

  Future<void> _syncDenganServer() async {
    setState(() => isLoading = true);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Menarik data riwayat dari server...')),
    );
    
    String nik = widget.balita?['nik'] ?? '';
    String balitaId = (nik.isEmpty || nik == '-') ? (widget.balita?['id'] ?? '') : nik;
    bool success = await ApiService().fetchRiwayatKMSFromServer(balitaId);
    
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sinkronisasi berhasil! Z-Score diperbarui.'), backgroundColor: Colors.teal),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gagal sinkronisasi. Coba lagi nanti.'), backgroundColor: Colors.orange),
      );
    }
    
    // Tarik ulang dari SQLite yang sudah diperbarui
    await _loadData();
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Riwayat KMS Digital'),
        backgroundColor: Colors.purple,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            tooltip: 'Tarik Data dari Server',
            onPressed: _syncDenganServer,
          ),
        ],
      ),
      body: Column(
        children: [
          // Profil Singkat Header
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: Colors.purple[100],
                  child: const Icon(Icons.child_friendly, size: 32, color: Colors.purple),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.balita?['nama'] ?? 'Budi Santoso',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      Text('Anak ${widget.balita?['ibu'] ?? ''} • ${widget.balita?['umur'] ?? '14 Bulan'}', style: const TextStyle(color: Colors.grey)),
                      const SizedBox(height: 2),
                      Text('Tgl Lahir: ${widget.balita?['tanggal_lahir'] ?? '-'}', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                      const SizedBox(height: 4),
                      Text('NIK: ${widget.balita?['nik'] ?? widget.balita?['id'] ?? '-'}', style: const TextStyle(fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const Divider(height: 1, thickness: 1),
          
          // Judul List
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Catatan Pertumbuhan',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                OutlinedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => GrafikKmsPage(
                          balita: widget.balita,
                          data: riwayat,
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.show_chart, size: 16),
                  label: const Text('Lihat Grafik'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.purple,
                    side: const BorderSide(color: Colors.purple),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                  ),
                )
              ],
            ),
          ),
          
          // Timeline Riwayat
          Expanded(
            child: isLoading 
              ? const Center(child: CircularProgressIndicator())
              : riwayat.isEmpty
                ? const Center(child: Text('Belum ada riwayat pengukuran.'))
                : ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: riwayat.length,
              itemBuilder: (context, index) {
                final data = riwayat[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                  color: Colors.white,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              data['tanggal'],
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Wrap(
                                alignment: WrapAlignment.end,
                                crossAxisAlignment: WrapCrossAlignment.center,
                                spacing: 8,
                                runSpacing: 4,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: data['color'].withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      data['status'],
                                      style: TextStyle(
                                        color: data['color'],
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                InkWell(
                                  onTap: () async {
                                    final result = await Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => InputAntropometriPage(
                                          balita: widget.balita,
                                          initialData: data,
                                        ),
                                      ),
                                    );
                                    if (result == true) {
                                      _loadData();
                                    }
                                  },
                                  child: const Icon(Icons.edit, size: 20, color: Colors.grey),
                                ),
                                const SizedBox(width: 16),
                                  InkWell(
                                    onTap: () async {
                                      bool confirm = await showDialog(
                                        context: context,
                                        builder: (context) => AlertDialog(
                                          title: const Text('Hapus Pengukuran'),
                                          content: const Text('Apakah Anda yakin ingin menghapus catatan pertumbuhan ini?'),
                                          actions: [
                                            TextButton(
                                              onPressed: () => Navigator.pop(context, false),
                                              child: const Text('Batal'),
                                            ),
                                            TextButton(
                                              onPressed: () => Navigator.pop(context, true),
                                              child: const Text('Hapus', style: TextStyle(color: Colors.red)),
                                            ),
                                          ],
                                        ),
                                      ) ?? false;

                                      if (confirm) {
                                        // Hapus di server terlebih dahulu jika ini data tersinkron
                                        await ApiService().deleteAntropometri(data['id']);
                                        
                                        // Hapus dari SQLite lokal
                                        await DatabaseHelper().deleteAntropometri(data['id']);
                                        
                                        _loadData();
                                        if (context.mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(content: Text('Catatan berhasil dihapus')),
                                          );
                                        }
                                      }
                                    },
                                    child: const Icon(Icons.delete, size: 20, color: Colors.redAccent),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            _buildStatItem('Umur', data['umur']),
                            _buildStatItem('Berat', '${data['bb']} kg'),
                            _buildStatItem('Tinggi', '${data['tb']} cm'),
                            _buildStatItem('Z-Score', '${data['zscore_bb']}'),
                          ],
                        ),
                        if (data['evaluasi'] != null && data['evaluasi'].toString().isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 12),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.blue.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.blue.withOpacity(0.2)),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.info_outline, size: 20, color: Colors.blue),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      data['evaluasi'],
                                      style: const TextStyle(fontSize: 12, color: Colors.black87, height: 1.4),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => InputAntropometriPage(balita: widget.balita),
            ),
          );
          if (result == true) {
            _loadData();
          }
        },
        icon: const Icon(Icons.add),
        label: const Text('Catat Pengukuran Baru'),
        backgroundColor: Colors.purple,
        foregroundColor: Colors.white,
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
