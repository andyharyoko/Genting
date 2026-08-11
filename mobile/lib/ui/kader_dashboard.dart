import 'package:flutter/material.dart';
import 'input_antropometri_page.dart';
import 'cari_balita_page.dart';
import 'riwayat_kms_page.dart';
import '../database/database_helper.dart';
import '../services/api_service.dart';

class KaderDashboard extends StatefulWidget {
  const KaderDashboard({super.key});

  @override
  State<KaderDashboard> createState() => _KaderDashboardState();
}

class _KaderDashboardState extends State<KaderDashboard> {
  int _unsyncedCount = 0;
  bool _isSyncing = false;

  @override
  void initState() {
    super.initState();
    _loadUnsyncedCount();
  }

  Future<void> _loadUnsyncedCount() async {
    final antropometriDrafts = await DatabaseHelper().getUnsyncedDrafts();
    final balitaDrafts = await DatabaseHelper().getUnsyncedBalitaDrafts();
    setState(() {
      _unsyncedCount = antropometriDrafts.length + balitaDrafts.length;
    });
  }

  Future<void> _syncData() async {
    if (_unsyncedCount == 0) return;
    
    setState(() {
      _isSyncing = true;
    });

    final syncedBalita = await ApiService().syncBalitaDrafts();
    final syncedUkur = await ApiService().syncDrafts();
    final syncedCount = syncedBalita + syncedUkur;
    
    setState(() {
      _isSyncing = false;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Berhasil sinkronisasi $syncedCount data ke server!'),
          backgroundColor: Colors.teal,
        ),
      );
      _loadUnsyncedCount();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Halo, Ibu Kader',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Text(
              'Posyandu Flamboyan',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w400),
            ),
          ],
        ),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.account_circle, size: 28),
            onPressed: () {
              // Profile Action
            },
          )
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Offline Sync Banner
              if (_unsyncedCount > 0)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.amber[100],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.amber[300]!),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.cloud_off, color: Colors.orange),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Mode Offline: $_unsyncedCount data belum disinkronisasi.',
                          style: const TextStyle(
                            color: Colors.deepOrange,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      _isSyncing
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                              ),
                            )
                          : IconButton(
                              icon: const Icon(Icons.sync, color: Colors.orange),
                              onPressed: _syncData,
                              tooltip: 'Sync Sekarang',
                            ),
                    ],
                  ),
                ),
              if (_unsyncedCount > 0) const SizedBox(height: 24),
              
              const Text(
                'Menu Utama',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              
              // Grid Menu
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                children: [
                  _buildMenuCard(
                    context,
                    icon: Icons.qr_code_scanner,
                    title: 'Cari Balita',
                    subtitle: 'Scan NIK/KK',
                    color: Colors.blue,
                  ),
                  _buildMenuCard(
                    context,
                    icon: Icons.scale,
                    title: 'Input Ukur',
                    subtitle: 'BB & TB Terbaru',
                    color: Colors.teal,
                  ),
                  _buildMenuCard(
                    context,
                    icon: Icons.history,
                    title: 'Riwayat KMS',
                    subtitle: 'Grafik Z-Score',
                    color: Colors.purple,
                  ),
                  _buildMenuCard(
                    context,
                    icon: Icons.restaurant_menu,
                    title: 'Distribusi MBG',
                    subtitle: 'Scan Dompet Gizi',
                    color: Colors.orange,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuCard(BuildContext context, {required IconData icon, required String title, required String subtitle, required Color color}) {
    return InkWell(
      onTap: () async {
        if (title == 'Input Ukur') {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const InputAntropometriPage(),
            ),
          );
          if (result == true) {
            _loadUnsyncedCount(); // Refresh count if new draft added
          }
        } else if (title == 'Cari Balita') {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const CariBalitaPage(),
            ),
          );
        } else if (title == 'Riwayat KMS') {
          // Buka pencarian balita dulu agar NIK balita tidak null
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const CariBalitaPage(),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Menu $title diklik!')),
          );
        }
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              spreadRadius: 2,
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 36, color: color),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: TextStyle(color: Colors.grey[600], fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}
