import 'package:flutter/material.dart';
import 'riwayat_kms_page.dart';
import 'input_balita_page.dart';
import '../database/database_helper.dart';

class CariBalitaPage extends StatefulWidget {
  const CariBalitaPage({super.key});

  @override
  State<CariBalitaPage> createState() => _CariBalitaPageState();
}

class _CariBalitaPageState extends State<CariBalitaPage> {
  final TextEditingController _searchController = TextEditingController();
  
  // Mock Data Dihapus (Kini 100% menggunakan data dari Database Lokal/Server)
  final List<Map<String, dynamic>> _mockBalita = [];
  
  List<Map<String, dynamic>> _filteredBalita = [];
  List<Map<String, dynamic>> _dbBalita = [];

  @override
  void initState() {
    super.initState();
    _filteredBalita = _mockBalita;
    _loadBalitaFromDb();
  }

  Future<void> _loadBalitaFromDb() async {
    final drafts = await DatabaseHelper().getUnsyncedBalitaDrafts();
    setState(() {
      _dbBalita = drafts.map((row) => {
        'id': row['id'], // Tambahkan ID untuk referensi
        'nik': row['nik']?.isEmpty == true ? '-' : (row['nik'] ?? '-'),
        'nama': row['nama'],
        'umur': 'Baru Lahir',
        'ibu': row['nama_ibu'],
        'tanggal_lahir': row['tanggal_lahir'],
      }).toList();
      _onSearch(_searchController.text);
    });
  }

  void _onSearch(String query) {
    setState(() {
      List<Map<String, dynamic>> allBalita = [..._dbBalita, ..._mockBalita];
      if (query.isEmpty) {
        _filteredBalita = allBalita;
      } else {
        _filteredBalita = allBalita.where((balita) => 
          balita['nama'].toString().toLowerCase().contains(query.toLowerCase()) ||
          balita['nik'].toString().contains(query)
        ).toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Cari Profil Balita'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Search & Scan Bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    onChanged: _onSearch,
                    decoration: InputDecoration(
                      hintText: 'Cari NIK atau Nama...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      contentPadding: const EdgeInsets.symmetric(vertical: 0),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.blue[50],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.qr_code_scanner, color: Colors.blue),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Simulasi Kamera QR Code...')),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          
          const Divider(height: 1),
          
          // List View
          Expanded(
            child: ListView.separated(
              itemCount: _filteredBalita.length,
              separatorBuilder: (context, index) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final balita = _filteredBalita[index];
                return ListTile(
                  tileColor: Colors.white,
                  leading: CircleAvatar(
                    backgroundColor: Colors.blue[100],
                    child: const Icon(Icons.child_care, color: Colors.blue),
                  ),
                  title: Text(
                    balita['nama'],
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text('NIK: ${balita['nik']} • Anak ${balita['ibu']}'),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      balita['umur'],
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => RiwayatKmsPage(balita: balita),
                      ),
                    );
                  },
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
            MaterialPageRoute(builder: (context) => const InputBalitaPage()),
          );
          if (result == true) {
            _loadBalitaFromDb();
          }
        },
        icon: const Icon(Icons.person_add),
        label: const Text('Daftar Baru'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
    );
  }
}
