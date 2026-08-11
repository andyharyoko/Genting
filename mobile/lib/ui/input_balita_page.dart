import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../database/database_helper.dart';

class InputBalitaPage extends StatefulWidget {
  const InputBalitaPage({super.key});

  @override
  State<InputBalitaPage> createState() => _InputBalitaPageState();
}

class _InputBalitaPageState extends State<InputBalitaPage> {
  final _formKey = GlobalKey<FormState>();
  
  final _namaController = TextEditingController();
  final _nikController = TextEditingController();
  final _namaIbuController = TextEditingController();
  
  DateTime? _selectedDate;
  String _jenisKelamin = 'L'; // L atau P
  
  bool _isSaving = false;

  @override
  void dispose() {
    _namaController.dispose();
    _nikController.dispose();
    _namaIbuController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Colors.blue,
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

  void _saveData() async {
    if (_formKey.currentState!.validate()) {
      if (_selectedDate == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pilih tanggal lahir terlebih dahulu!')),
        );
        return;
      }

      setState(() {
        _isSaving = true;
      });

      // Generate ID
      final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
      final localId = 'BALITA-$timestamp';

      final data = {
        'id': localId,
        'nik': _nikController.text.trim(),
        'nama': _namaController.text.trim(),
        'tanggal_lahir': DateFormat('yyyy-MM-dd').format(_selectedDate!),
        'jenis_kelamin': _jenisKelamin,
        'nama_ibu': _namaIbuController.text.trim(),
        'is_synced': 0, // Offline mode
      };

      await DatabaseHelper().insertBalitaDraft(data);

      setState(() {
        _isSaving = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Pendaftaran balita berhasil disimpan secara Offline!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true); // return true to indicate success
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pendaftaran Balita Baru'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Info Banner
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: Colors.blue),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Pendaftaran ini disimpan secara lokal (Offline) dan akan disinkronisasi ketika ada sinyal internet. NIK bersifat opsional.',
                        style: TextStyle(color: Colors.blue[800], fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),

              // NIK
              TextFormField(
                controller: _nikController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'NIK Balita (Opsional)',
                  hintText: 'Kosongkan jika belum memiliki NIK',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.credit_card),
                ),
              ),
              const SizedBox(height: 16),

              // Nama Balita
              TextFormField(
                controller: _namaController,
                decoration: InputDecoration(
                  labelText: 'Nama Lengkap Balita *',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.child_care),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Nama tidak boleh kosong';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Nama Ibu
              TextFormField(
                controller: _namaIbuController,
                decoration: InputDecoration(
                  labelText: 'Nama Ibu Kandung *',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.pregnant_woman),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Nama ibu tidak boleh kosong';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Tanggal Lahir
              InkWell(
                onTap: () => _selectDate(context),
                child: InputDecorator(
                  decoration: InputDecoration(
                    labelText: 'Tanggal Lahir *',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    prefixIcon: const Icon(Icons.calendar_today),
                  ),
                  child: Text(
                    _selectedDate == null 
                        ? 'Pilih Tanggal' 
                        : DateFormat('dd MMMM yyyy').format(_selectedDate!),
                    style: TextStyle(
                      color: _selectedDate == null ? Colors.grey[600] : Colors.black,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Jenis Kelamin
              const Text('Jenis Kelamin *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: RadioListTile<String>(
                      title: const Text('Laki-laki'),
                      value: 'L',
                      groupValue: _jenisKelamin,
                      onChanged: (value) {
                        setState(() { _jenisKelamin = value!; });
                      },
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                  Expanded(
                    child: RadioListTile<String>(
                      title: const Text('Perempuan'),
                      value: 'P',
                      groupValue: _jenisKelamin,
                      onChanged: (value) {
                        setState(() { _jenisKelamin = value!; });
                      },
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 32),
              
              // Simpan Button
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: _isSaving ? null : _saveData,
                  icon: _isSaving 
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Icon(Icons.save),
                  label: Text(_isSaving ? 'Menyimpan...' : 'Simpan Balita (Offline)'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
