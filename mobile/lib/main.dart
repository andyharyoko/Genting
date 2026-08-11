import 'package:flutter/material.dart';
import 'ui/login_page.dart';

void main() {
  runApp(const GentingApp());
}

class GentingApp extends StatelessWidget {
  const GentingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GENTING Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal),
        useMaterial3: true,
        fontFamily: 'Roboto', // We can switch to Google Fonts 'Inter' later
      ),
      home: const LoginPage(),
    );
  }
}
