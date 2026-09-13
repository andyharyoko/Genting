import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class DatabaseHelper {
  static final DatabaseHelper _instance = DatabaseHelper._internal();
  static Database? _database;

  factory DatabaseHelper() => _instance;

  DatabaseHelper._internal();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    String path = join(await getDatabasesPath(), 'genting_offline.db');
    return await openDatabase(
      path,
      version: 5,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    await _createTables(db);
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute('''
        CREATE TABLE balita_drafts (
          id TEXT PRIMARY KEY,
          nik TEXT,
          nama TEXT NOT NULL,
          tanggal_lahir TEXT NOT NULL,
          jenis_kelamin TEXT NOT NULL,
          nama_ibu TEXT NOT NULL,
          is_synced INTEGER DEFAULT 0
        )
      ''');
    }
    if (oldVersion < 3) {
      await db.execute('ALTER TABLE antropometri_drafts ADD COLUMN z_score REAL;');
      await db.execute('ALTER TABLE antropometri_drafts ADD COLUMN status_gizi TEXT;');
    }
    if (oldVersion < 4) {
      await db.execute('ALTER TABLE antropometri_drafts ADD COLUMN evaluasi TEXT;');
    }
    if (oldVersion < 5) {
      await _createBalitaCacheTable(db);
    }
  }

  Future<void> _createBalitaCacheTable(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS balita_cache (
        id TEXT PRIMARY KEY,
        nama TEXT NOT NULL,
        jenis_kelamin TEXT NOT NULL,
        tanggal_lahir TEXT NOT NULL,
        umur TEXT,
        nama_ibu TEXT,
        tanggal_ukur_terakhir TEXT,
        berat_badan_terakhir TEXT,
        tinggi_badan_terakhir TEXT,
        status_gizi TEXT
      )
    ''');
  }

  Future<void> _createTables(Database db) async {
    await db.execute('''
      CREATE TABLE antropometri_drafts (
        id TEXT PRIMARY KEY,
        balita_id TEXT NOT NULL,
        tanggal_ukur TEXT NOT NULL,
        berat_badan REAL NOT NULL,
        tinggi_badan REAL NOT NULL,
        posisi_ukur TEXT NOT NULL,
        z_score REAL,
        status_gizi TEXT,
        evaluasi TEXT,
        is_synced INTEGER DEFAULT 0
      )
    ''');
    
    await db.execute('''
      CREATE TABLE balita_drafts (
        id TEXT PRIMARY KEY,
        nik TEXT,
        nama TEXT NOT NULL,
        tanggal_lahir TEXT NOT NULL,
        jenis_kelamin TEXT NOT NULL,
        nama_ibu TEXT NOT NULL,
        is_synced INTEGER DEFAULT 0
      )
    ''');
    
    await _createBalitaCacheTable(db);
  }

  Future<int> insertDraft(Map<String, dynamic> row) async {
    Database db = await database;
    return await db.insert('antropometri_drafts', row);
  }

  Future<List<Map<String, dynamic>>> getUnsyncedDrafts() async {
    Database db = await database;
    return await db.query('antropometri_drafts', where: 'is_synced = ?', whereArgs: [0]);
  }

  Future<List<Map<String, dynamic>>> getAntropometriByBalita(String balitaId) async {
    Database db = await database;
    return await db.query(
      'antropometri_drafts', 
      where: 'balita_id = ?', 
      whereArgs: [balitaId],
      orderBy: 'tanggal_ukur DESC',
    );
  }

  Future<int> updateDraft(Map<String, dynamic> row) async {
    Database db = await database;
    return await db.update(
      'antropometri_drafts', 
      row, 
      where: 'id = ?', 
      whereArgs: [row['id']],
    );
  }

  Future<int> deleteAntropometri(String id) async {
    Database db = await database;
    return await db.delete(
      'antropometri_drafts',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<int> insertBalitaDraft(Map<String, dynamic> row) async {
    Database db = await database;
    return await db.insert('balita_drafts', row);
  }

  Future<List<Map<String, dynamic>>> getUnsyncedBalitaDrafts() async {
    Database db = await database;
    return await db.query('balita_drafts', where: 'is_synced = ?', whereArgs: [0]);
  }

  // Menyimpan/menimpa (Upsert) data yang ditarik dari Server VPS
  Future<void> syncServerToLocal(List<dynamic> serverData, String balitaId) async {
    Database db = await database;
    Batch batch = db.batch();
    
    // Hapus SEMUA data lokal (yang sudah tersinkron) untuk balita ini
    // agar data lokal selalu sama persis dengan kondisi riil di server.
    batch.delete(
      'antropometri_drafts',
      where: 'balita_id = ? AND is_synced = 1',
      whereArgs: [balitaId],
    );

    for (var item in serverData) {
      // Masukkan data terbaru dari server
      batch.insert(
        'antropometri_drafts', 
        {
          'id': item['id'].toString(), // Gunakan ID dari server
          'balita_id': balitaId,
          'tanggal_ukur': item['tanggal_ukur'],
          'berat_badan': item['berat_badan'],
          'tinggi_badan': item['tinggi_badan'],
          'posisi_ukur': item['posisi_ukur'] ?? 'Berdiri',
          'z_score': item['z_score'], // Nilai riil hitungan server
          'status_gizi': item['status_gizi'],
          'evaluasi': item['evaluasi'],
          'is_synced': 1, // Sudah tersinkron
        },
        conflictAlgorithm: ConflictAlgorithm.replace // UPSERT
      );
    }
    
    await batch.commit(noResult: true);
  }

  Future<void> cacheLaporanBalita(List<dynamic> serverData) async {
    Database db = await database;
    Batch batch = db.batch();
    
    // Clear existing cache
    batch.delete('balita_cache');
    
    for (var item in serverData) {
      batch.insert(
        'balita_cache',
        {
          'id': item['id'].toString(),
          'nama': item['nama']?.toString() ?? '',
          'jenis_kelamin': item['jk']?.toString() ?? '',
          'tanggal_lahir': item['tanggal_lahir']?.toString() ?? '',
          'umur': item['umur']?.toString() ?? '',
          'nama_ibu': item['nama_ibu']?.toString() ?? '',
          'tanggal_ukur_terakhir': item['tanggal_ukur_terakhir']?.toString() ?? '',
          'berat_badan_terakhir': item['berat_badan_terakhir']?.toString() ?? '',
          'tinggi_badan_terakhir': item['tinggi_badan_terakhir']?.toString() ?? '',
          'status_gizi': item['status_gizi']?.toString() ?? '',
        }
      );
    }
    
    await batch.commit(noResult: true);
  }

  Future<List<Map<String, dynamic>>> getCachedLaporanBalita() async {
    Database db = await database;
    return await db.query('balita_cache', orderBy: 'nama ASC');
  }
}
