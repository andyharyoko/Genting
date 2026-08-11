import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

class GrafikKmsPage extends StatelessWidget {
  final Map<String, dynamic>? balita;
  final List<Map<String, dynamic>> data;

  const GrafikKmsPage({super.key, this.balita, required this.data});

  @override
  Widget build(BuildContext context) {
    // Generate Spots (X = Pengukuran Ke, Y = Berat Badan)
    // Reverse the data so oldest is first (left to right)
    final reversedData = data.reversed.toList();
    
    DateTime? tglLahir;
    if (balita?['tanggal_lahir'] != null) {
      try {
        tglLahir = DateTime.parse(balita!['tanggal_lahir']);
      } catch (e) {}
    }

    // Fungsi simulasi Z-Score sederhana untuk keperluan Offline Demo
    double hitungZScoreSimulasi(double bb, int umurBulan) {
      double median = 9.0;
      double sd = 1.0;
      if (umurBulan <= 0) { median = 3.3; sd = 0.5; }
      else if (umurBulan <= 3) { median = 6.0; sd = 0.8; }
      else if (umurBulan <= 6) { median = 7.9; sd = 1.0; }
      else if (umurBulan <= 12) { median = 9.6; sd = 1.2; }
      else if (umurBulan <= 24) { median = 12.2; sd = 1.5; }
      else { median = 14.0; sd = 1.8; }
      return (bb - median) / sd;
    }

    final List<FlSpot> spots = List.generate(reversedData.length, (index) {
      double xValue = (index + 1).toDouble();
      int months = 0;
      
      if (tglLahir != null && reversedData[index]['tanggal_ukur'] != null) {
        try {
          DateTime tglUkur = DateTime.parse(reversedData[index]['tanggal_ukur']);
          months = (tglUkur.year - tglLahir.year) * 12 + tglUkur.month - tglLahir.month;
          if (tglUkur.day < tglLahir.day) {
            months--;
          }
          if (months < 0) months = 0;
          xValue = months.toDouble();
        } catch (e) {}
      }
      
      double bb = (reversedData[index]['bb'] as num).toDouble();
      
      // Coba baca z-score riil dari server (jika sudah sync)
      double zScore;
      var zScoreRaw = reversedData[index]['zscore_bb'];
      if (zScoreRaw != null && zScoreRaw != 'Tunda Sync') {
        zScore = double.tryParse(zScoreRaw.toString()) ?? hitungZScoreSimulasi(bb, months);
      } else {
        // Fallback jika belum sync
        zScore = hitungZScoreSimulasi(bb, months);
      }
      
      return FlSpot(xValue, zScore);
    });

    // Find min and max for X-axis
    double minX = 1000;
    double maxX = 0;
    
    for (var spot in spots) {
      if (spot.x > maxX) maxX = spot.x;
      if (spot.x < minX) minX = spot.x;
    }
    
    if (spots.isEmpty) {
      minX = 0;
      maxX = 12;
    } else {
      minX = (minX - 1).clamp(0, 100).toDouble();
      maxX = maxX + 2;
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text('Grafik KMS - ${balita?['nama'] ?? 'Balita'}'),
        backgroundColor: Colors.purple,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16.0),
            color: Colors.purple[50],
            child: Row(
              children: [
                const Icon(Icons.info_outline, color: Colors.purple),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Grafik menunjukkan perkembangan nilai Z-Score Berat Badan berdasarkan Umur.',
                    style: TextStyle(fontSize: 13, color: Colors.purple),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(right: 32, left: 16, top: 48, bottom: 24),
              child: LineChart(
                LineChartData(
                  minY: -4,
                  maxY: 3,
                  minX: minX,
                  maxX: maxX,
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: true,
                    horizontalInterval: 1,
                    getDrawingHorizontalLine: (value) {
                      return FlLine(
                        color: Colors.grey.withOpacity(0.3),
                        strokeWidth: 1,
                      );
                    },
                    getDrawingVerticalLine: (value) {
                      return FlLine(
                        color: Colors.grey.withOpacity(0.3),
                        strokeWidth: 1,
                      );
                    },
                  ),
                  titlesData: FlTitlesData(
                    show: true,
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    bottomTitles: AxisTitles(
                      axisNameWidget: const Padding(
                        padding: EdgeInsets.only(top: 8.0),
                        child: Text('Usia Anak (Bulan)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 30,
                        interval: 1,
                        getTitlesWidget: (value, meta) {
                          if (value % 1 != 0 || value < minX || value > maxX) return const SizedBox.shrink();
                          return Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: Text('${value.toInt()}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                          );
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      axisNameWidget: const Text('Z-Score', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      sideTitles: SideTitles(
                        showTitles: true,
                        interval: 1,
                        reservedSize: 42,
                        getTitlesWidget: (value, meta) {
                          return Text('${value.toInt()}', style: const TextStyle(color: Colors.grey, fontSize: 12));
                        },
                      ),
                    ),
                  ),
                  borderData: FlBorderData(
                    show: true,
                    border: Border.all(color: Colors.grey.withOpacity(0.5)),
                  ),
                  extraLinesData: ExtraLinesData(
                    horizontalLines: [
                      HorizontalLine(
                        y: -2.0,
                        color: Colors.red,
                        strokeWidth: 2,
                        dashArray: [5, 5],
                        label: HorizontalLineLabel(
                          show: true,
                          alignment: Alignment.topRight,
                          padding: const EdgeInsets.only(right: 5, bottom: 5),
                          style: const TextStyle(color: Colors.red, fontSize: 10, fontWeight: FontWeight.bold),
                          labelResolver: (line) => 'Batas Underweight (-2)',
                        ),
                      ),
                      HorizontalLine(
                        y: 0,
                        color: Colors.green,
                        strokeWidth: 2,
                        dashArray: [5, 5],
                        label: HorizontalLineLabel(
                          show: true,
                          alignment: Alignment.topRight,
                          padding: const EdgeInsets.only(right: 5, bottom: 5),
                          style: const TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold),
                          labelResolver: (line) => 'Median WHO (0)',
                        ),
                      ),
                    ],
                  ),
                  lineBarsData: [
                    LineChartBarData(
                      spots: spots,
                      isCurved: true,
                      color: Colors.purple,
                      barWidth: 4,
                      isStrokeCapRound: true,
                      dotData: FlDotData(
                        show: true,
                        getDotPainter: (spot, percent, barData, index) {
                          return FlDotCirclePainter(
                            radius: 6,
                            color: Colors.white,
                            strokeWidth: 3,
                            strokeColor: spot.y < -2 ? Colors.red : Colors.purple,
                          );
                        },
                      ),
                      belowBarData: BarAreaData(
                        show: true,
                        color: Colors.purple.withOpacity(0.1),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
