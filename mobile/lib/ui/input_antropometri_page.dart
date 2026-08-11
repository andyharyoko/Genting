import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../database/database_helper.dart';
import '../services/api_service.dart';

class InputAntropometriPage extends StatefulWidget {
  final Map<String, dynamic>? balita;
  final Map<String, dynamic>? initialData;

  const InputAntropometriPage({super.key, this.balita, this.initialData});

  @override
  State<InputAntropometriPage> createState() => _InputAntropometriPageState();
}

class _InputAntropometriPageState extends State<InputAntropometriPage> {
  final _formKey = GlobalKey<FormState>();
  final _nikController = TextEditingController();
  final _beratController = TextEditingController();
  final _tinggiController = TextEditingController();
  
  String _posisiUkur = 'Berdiri';
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    if (widget.balita != null) {
      String nik = widget.balita!['nik'] ?? '';
      String id = widget.balita!['id'] ?? '';
      _nikController.text = (nik.isEmpty || nik == '-') ? id : nik;
    }
    if (widget.initialData != null) {
      _beratController.text = widget.initialData!['bb']?.toString() ?? '';
      _tinggiController.text = widget.initialData!['tb']?.toString() ?? '';
      if (widget.initialData!['tanggal_ukur'] != null) {
        try {
          _selectedDate = DateTime.parse(widget.initialData!['tanggal_ukur']);
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Colors.teal,
              onPrimary: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  @override
  void dispose() {
    _nikController.dispose();
    _beratController.dispose();
    _tinggiController.dispose();
    super.dispose();
  }

  Future<void> _simpanData() async {
    if (_formKey.currentState!.validate()) {
      
      if (widget.initialData != null && widget.initialData!['id'] != null) {
        // Mode Edit (Update Server & SQLite)
        final draft = {
          'id': widget.initialData!['id'],
          'balita_id': _nikController.text,
          'tanggal_ukur': DateFormat('yyyy-MM-dd').format(_selectedDate),
          'berat_badan': double.parse(_beratController.text),
          'tinggi_badan': double.parse(_tinggiController.text),
          'posisi_ukur': _posisiUkur,
          'is_synced': 1 // Asumsikan sukses update di server (karena API jalan)
        };
        
        // Coba update ke server
        bool updated = await ApiService().updateAntropometri(draft['id'].toString(), draft);
        if (!updated) {
           // Jika gagal atau offline, biarkan is_synced = 0 agar bisa di syncDrafts
           // Namun karena ini UUID dari server, _syncDrafts harusnya POST
           // Oleh karena itu untuk sekarang kita kembalikan saja jika gagal online
           if (mounted) {
             ScaffoldMessenger.of(context).showSnackBar(
               const SnackBar(content: Text('Edit memerlukan koneksi internet untuk sinkronisasi. Coba lagi.')),
             );
           }
           return;
        }

        // Hapus draf lokal jika diset untuk menghapus setelah sync,
        // namun untuk saat ini sesuai pola edit, kita hapus agar di-fetch ulang dari server
        await DatabaseHelper().deleteAntropometri(draft['id'].toString());
      } else {
        // Mode Create (Insert SQLite)
        final draft = {
          'id': DateTime.now().millisecondsSinceEpoch.toString(),
          'balita_id': _nikController.text,
          'tanggal_ukur': DateFormat('yyyy-MM-dd').format(_selectedDate),
          'berat_badan': double.parse(_beratController.text),
          'tinggi_badan': double.parse(_tinggiController.text),
          'posisi_ukur': _posisiUkur,
          'is_synced': 0
        };
        await DatabaseHelper().insertDraft(draft);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.initialData != null ? 'Perubahan berhasil disimpan!' : 'Data berhasil disimpan secara offline!'),
            backgroundColor: Colors.teal,
          ),
        );
        Navigator.pop(context, true); // Return true to signal dashboard update
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Input Antropometri'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header Info Balita (Jika diakses dari Riwayat KMS)
              if (widget.balita != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.teal[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.child_care, color: Colors.teal),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Pencatatan untuk: ${widget.balita!['nama']}',
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.teal),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
              
              // NIK / ID Input
              if (widget.balita == null) ...[
                TextFormField(
                  controller: _nikController,
                  decoration: const InputDecoration(
                    labelText: 'NIK / ID Balita',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.person_search),
                  ),
                  keyboardType: TextInputType.number,
                  validator: (value) => value!.isEmpty ? 'Wajib diisi' : null,
                ),
                const SizedBox(height: 16),
              ],
              
              // Tanggal Pengukuran
              InkWell(
                onTap: () => _selectDate(context),
                child: InputDecorator(
                  decoration: InputDecoration(
                    labelText: 'Tanggal Pengukuran *',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    prefixIcon: const Icon(Icons.calendar_today, color: Colors.teal),
                  ),
                  child: Text(
                    DateFormat('dd MMMM yyyy').format(_selectedDate),
                    style: const TextStyle(
                      color: Colors.black,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Berat Badan Input
              TextFormField(
                controller: _beratController,
                decoration: const InputDecoration(
                  labelText: 'Berat Badan (kg)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.monitor_weight),
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                validator: (value) => value!.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              
              // Tinggi Badan Input
              TextFormField(
                controller: _tinggiController,
                decoration: const InputDecoration(
                  labelText: 'Tinggi Badan (cm)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.height),
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                validator: (value) => value!.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              
              // Posisi Ukur Toggle
              const Text(
                'Posisi Ukur:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              Row(
                children: [
                  Radio<String>(
                    value: 'Berdiri',
                    groupValue: _posisiUkur,
                    activeColor: Colors.teal,
                    onChanged: (val) {
                      setState(() {
                        _posisiUkur = val!;
                      });
                    },
                  ),
                  const Text('Berdiri'),
                  const SizedBox(width: 16),
                  Radio<String>(
                    value: 'Terlentang',
                    groupValue: _posisiUkur,
                    activeColor: Colors.teal,
                    onChanged: (val) {
                      setState(() {
                        _posisiUkur = val!;
                      });
                    },
                  ),
                  const Text('Terlentang'),
                ],
              ),
              const SizedBox(height: 32),
              
              // Submit Button
              ElevatedButton(
                onPressed: _simpanData,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.teal,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text(
                  widget.initialData != null ? 'SIMPAN PERUBAHAN (OFFLINE)' : 'SIMPAN (OFFLINE)',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
