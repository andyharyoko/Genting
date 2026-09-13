import 'dart:convert';
import 'package:http/http.dart' as http;
import '../database/database_helper.dart';
import 'package:sqflite/sqflite.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Using 10.0.2.2 because Android Emulator maps it to localhost of the host machine
  static const String baseUrl = 'http://10.0.2.2:8000/api/v1';

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      final resBody = jsonDecode(response.body);
      
      if (response.statusCode == 200 && resBody['success'] == true) {
        final token = resBody['data']['token'];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', token);
        
        return {'success': true, 'message': 'Login berhasil'};
      } else {
        return {'success': false, 'message': resBody['message'] ?? 'Gagal login'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Terjadi kesalahan jaringan: $e'};
    }
  }

  Future<int> syncDrafts() async {
    final drafts = await DatabaseHelper().getUnsyncedDrafts();
    if (drafts.isEmpty) return 0;

    int syncedCount = 0;
    String? token = await getToken();
    Database db = await DatabaseHelper().database;

    for (var draft in drafts) {
      try {
        final response = await http.post(
          Uri.parse('$baseUrl/sync/antropometri'),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            if (token != null) 'Authorization': 'Bearer $token',
          },
          body: jsonEncode({
            'data': [
              {
                'balita_id': draft['balita_id'],
                'tanggal_ukur': draft['tanggal_ukur'],
                'berat_badan': draft['berat_badan'],
                'tinggi_badan': draft['tinggi_badan'],
                'posisi_ukur': draft['posisi_ukur'] ?? 'Berdiri',
              }
            ]
          }),
        );

        if (response.statusCode == 200 || response.statusCode == 201) {
          final resBody = jsonDecode(response.body);
          if (resBody['status'] == 'success') {
            bool hasError = false;
            final results = resBody['results'] as List<dynamic>? ?? [];
            for (var res in results) {
              if (res['status'] == 'error') {
                hasError = true;
                print('Server Error for ${draft['id']}: ${res['message']}');
              }
            }
            
            if (!hasError) {
              await db.delete(
                'antropometri_drafts',
                where: 'id = ?',
                whereArgs: [draft['id']],
              );
              syncedCount++;
            }
          } else {
            print('Failed to sync ${draft['id']}: ${response.body}');
          }
        } else {
          print('Failed to sync ${draft['id']} HTTP ${response.statusCode}: ${response.body}');
        }
      } catch (e) {
        print('Error syncing ${draft['id']}: $e');
        // Likely a network error, we just break or continue, 
        // the remaining will stay is_synced = 0
      }
    }

    return syncedCount;
  }

  Future<int> syncBalitaDrafts() async {
    final drafts = await DatabaseHelper().getUnsyncedBalitaDrafts();
    if (drafts.isEmpty) return 0;

    int syncedCount = 0;
    String? token = await getToken();
    Database db = await DatabaseHelper().database;

    for (var draft in drafts) {
      try {
        final response = await http.post(
          Uri.parse('$baseUrl/sync/balita'),
          headers: {
            'Content-Type': 'application/json',
            if (token != null) 'Authorization': 'Bearer $token',
          },
          body: jsonEncode({
            'local_id': draft['id'],
            'nik': draft['nik'],
            'nama': draft['nama'],
            'tanggal_lahir': draft['tanggal_lahir'],
            'jenis_kelamin': draft['jenis_kelamin'],
            'nama_ibu': draft['nama_ibu'],
          }),
        );

        if (response.statusCode == 200 || response.statusCode == 201) {
          await db.delete(
            'balita_drafts',
            where: 'id = ?',
            whereArgs: [draft['id']],
          );
          syncedCount++;
        } else {
          print('Failed to sync balita ${draft['id']}: ${response.body}');
        }
      } catch (e) {
        print('Error syncing balita ${draft['id']}: $e');
      }
    }

    return syncedCount;
  }

  Future<bool> fetchRiwayatKMSFromServer(String nik) async {
    try {
      // Pastikan data profil balita tersinkron dulu
      await syncBalitaDrafts();
      // Kemudian sinkron draf pengukurannya
      await syncDrafts();

      String? token = await getToken();

      // Endpoint GET /api/v1/balita/{nik}/riwayat
      final response = await http.get(
        Uri.parse('$baseUrl/balita/$nik/riwayat'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        
        // Asumsi data JSON: { "data": [ { "id": 1, "tanggal_ukur": "...", ... } ] }
        final List<dynamic> historyData = responseData['data'] ?? [];
        
        // Panggil database helper untuk menimpa data lokal
        await DatabaseHelper().syncServerToLocal(historyData, nik);
        
        return true;
      } else {
        print('Gagal menarik data riwayat dari server: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      print('Error menarik riwayat KMS: $e');
      return false;
    }
  }

  Future<bool> deleteAntropometri(String id) async {
    try {
      String? token = await getToken();
      final response = await http.delete(
        Uri.parse('$baseUrl/antropometri/$id'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
      
      if (response.statusCode == 200 || response.statusCode == 204) {
        return true;
      }
      print('Failed to delete on server: ${response.statusCode}');
      return false;
    } catch (e) {
      print('Error deleting antropometri on server: $e');
      return false;
    }
  }

  Future<bool> updateAntropometri(String id, Map<String, dynamic> data) async {
    try {
      String? token = await getToken();
      final response = await http.put(
        Uri.parse('$baseUrl/antropometri/$id'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode(data),
      );
      
      if (response.statusCode == 200) {
        return true;
      }
      print('Failed to update on server: ${response.statusCode}');
      return false;
    } catch (e) {
      print('Error updating antropometri on server: $e');
      return false;
    }
  }

  Future<List<dynamic>> fetchLaporanBalita() async {
    try {
      String? token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/balita'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        final List<dynamic> data = responseData['data'] ?? [];
        
        // Cache the data into SQLite
        await DatabaseHelper().cacheLaporanBalita(data);
        
        return data;
      } else {
        print('Failed to fetch laporan balita: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('Error fetching laporan balita: $e');
      return [];
    }
  }
}
