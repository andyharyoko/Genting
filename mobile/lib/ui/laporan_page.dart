import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../database/database_helper.dart';

class LaporanPage extends StatefulWidget {
  const LaporanPage({super.key});

  @override
  State<LaporanPage> createState() => _LaporanPageState();
}

class _LaporanPageState extends State<LaporanPage> {
  bool _isLoading = true;
  List<dynamic> _balitaList = [];
  int _totalBalita = 0;
  int _normalCount = 0;
  int _stuntingCount = 0;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData({bool forceRefresh = false}) async {
    setState(() {
      _isLoading = true;
    });

    List<dynamic> data = [];
    
    if (forceRefresh) {
      // Pull from server and cache it
      data = await ApiService().fetchLaporanBalita();
    } else {
      // Read from local cache first
      data = await DatabaseHelper().getCachedLaporanBalita();
      
      // If cache is empty, try fetching from server
      if (data.isEmpty) {
        data = await ApiService().fetchLaporanBalita();
      }
    }
    
    int normal = 0;
    int stunting = 0;

    for (var b in data) {
      String status = (b['status_gizi'] ?? '').toString().toUpperCase();
      if (status == 'NORMAL' || status == 'GIZI BAIK' || status == '') {
        normal++;
      } else {
        stunting++;
      }
    }

    setState(() {
      _balitaList = data;
      _totalBalita = data.length;
      _normalCount = normal;
      _stuntingCount = stunting;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Laporan Posyandu'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _fetchData(forceRefresh: true),
          ),
        ],
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                _buildSummaryCards(),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Daftar Anak',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                Expanded(
                  child: _balitaList.isEmpty
                      ? const Center(child: Text('Belum ada data balita.'))
                      : ListView.builder(
                          itemCount: _balitaList.length,
                          itemBuilder: (context, index) {
                            final b = _balitaList[index];
                            return _buildBalitaCard(b);
                          },
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildSummaryCards() {
    return Container(
      padding: const EdgeInsets.all(16.0),
      color: Colors.white,
      child: Row(
        children: [
          Expanded(child: _buildStatCard('Total\nBalita', _totalBalita.toString(), Colors.blue)),
          const SizedBox(width: 8),
          Expanded(child: _buildStatCard('Gizi\nBaik', _normalCount.toString(), Colors.green)),
          const SizedBox(width: 8),
          Expanded(child: _buildStatCard('Perlu\nPerhatian', _stuntingCount.toString(), Colors.red)),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color.withOpacity(0.8),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBalitaCard(dynamic balita) {
    String statusGizi = balita['status_gizi'] ?? '-';
    bool isStunted = statusGizi.toUpperCase().contains('STUNTED') || 
                     statusGizi.toUpperCase().contains('BURUK') ||
                     statusGizi.toUpperCase().contains('KURANG');
    
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 6.0),
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    balita['nama'] ?? 'Tidak ada nama',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isStunted ? Colors.red[50] : Colors.green[50],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: isStunted ? Colors.red[200]! : Colors.green[200]!),
                  ),
                  child: Text(
                    statusGizi,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: isStunted ? Colors.red[700] : Colors.green[700],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.cake, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  '${balita['tanggal_lahir'] ?? '-'} (${balita['umur'] ?? '-'})',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.pregnant_woman, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  'Ibu: ${balita['nama_ibu'] ?? '-'}',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
            const Divider(height: 16),
            const Text(
              'Pengukuran Terakhir:',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Tgl: ${balita['tanggal_ukur_terakhir'] ?? '-'}',
                  style: const TextStyle(fontSize: 12),
                ),
                Text(
                  'BB: ${balita['berat_badan_terakhir'] ?? '-'} kg',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                Text(
                  'TB: ${balita['tinggi_badan_terakhir'] ?? '-'} cm',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
