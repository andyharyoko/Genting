import 'package:flutter/material.dart';
import 'kader_dashboard.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              // GENTING Logo or Title
              const Icon(
                Icons.health_and_safety,
                size: 100,
                color: Colors.teal,
              ),
              const SizedBox(height: 24),
              const Text(
                'GENTING',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.teal,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Generasi Sehat, Indonesia Cemerlang',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 48),
              
              // Google SSO Button
              ElevatedButton.icon(
                onPressed: () {
                  // Simulate successful login and navigate to Dashboard
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const KaderDashboard(),
                    ),
                  );
                },
                icon: const Icon(Icons.login, color: Colors.teal),
                label: const Text(
                  'Login dengan Google',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.teal,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.teal,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: Colors.teal, width: 2),
                  ),
                  elevation: 0,
                ),
              ),
              
              const SizedBox(height: 16),
              const Text(
                'Aplikasi khusus Kader Posyandu & Tenaga Kesehatan',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const Spacer(),
              
              // Bottom Footer
              const Padding(
                padding: EdgeInsets.only(bottom: 16.0),
                child: Text(
                  'Versi 1.0.0 (Offline-First Ready)',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
