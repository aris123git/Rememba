import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

const remembaInk = Color(0xFF100E0C);
const remembaInkSoft = Color(0xFF1B1714);
const remembaPaper = Color(0xFFF4EEE4);
const remembaMuted = Color(0xFFB7AA98);
const remembaGold = Color(0xFFE0B15A);
const remembaDanger = Color(0xFFE07A6A);

ThemeData remembaTheme() {
  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: remembaInk,
    colorScheme: const ColorScheme.dark(
      surface: remembaInkSoft,
      primary: remembaGold,
      onPrimary: remembaInk,
      secondary: remembaGold,
      error: remembaDanger,
    ),
  );
  return base.copyWith(
    textTheme: GoogleFonts.outfitTextTheme(base.textTheme).apply(
      bodyColor: remembaPaper,
      displayColor: remembaPaper,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: remembaInk,
      foregroundColor: remembaPaper,
      elevation: 0,
      titleTextStyle: GoogleFonts.fraunces(
        color: remembaPaper,
        fontSize: 22,
        fontWeight: FontWeight.w500,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.black.withValues(alpha: 0.25),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: remembaPaper.withValues(alpha: 0.12)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: remembaPaper.withValues(alpha: 0.12)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: remembaGold),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: remembaInkSoft,
      indicatorColor: remembaGold.withValues(alpha: 0.25),
      labelTextStyle: WidgetStatePropertyAll(
        GoogleFonts.outfit(fontSize: 11, color: remembaPaper),
      ),
    ),
  );
}

TextStyle serifStyle({double size = 32, Color color = remembaPaper}) {
  return GoogleFonts.fraunces(
    fontSize: size,
    color: color,
    fontWeight: FontWeight.w500,
    height: 1.1,
  );
}
