import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

const remembaInk = Color(0xFF05050A);
const remembaInkSoft = Color(0xFF101018);
const remembaPaper = Color(0xFFF4F1EA);
const remembaMuted = Color(0xFF9A96A8);
const remembaAccent = Color(0xFF8B6CFF);
const remembaCyan = Color(0xFF5EE7FF);
const remembaGold = remembaAccent;
const remembaDanger = Color(0xFFE07A6A);
const remembaGlass = Color(0x14FFFFFF);

ThemeData remembaTheme() {
  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: remembaInk,
    colorScheme: const ColorScheme.dark(
      surface: remembaInkSoft,
      primary: remembaAccent,
      onPrimary: Colors.white,
      secondary: remembaCyan,
      error: remembaDanger,
    ),
  );
  return base.copyWith(
    textTheme: GoogleFonts.outfitTextTheme(base.textTheme).apply(
      bodyColor: remembaPaper,
      displayColor: remembaPaper,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      foregroundColor: remembaPaper,
      elevation: 0,
      titleTextStyle: GoogleFonts.outfit(
        color: remembaPaper,
        fontSize: 18,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.2,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white.withValues(alpha: 0.05),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(22),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(22),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(22),
        borderSide: const BorderSide(color: remembaAccent),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: const Color(0xE605050A),
      indicatorColor: remembaAccent.withValues(alpha: 0.22),
      labelTextStyle: WidgetStatePropertyAll(
        GoogleFonts.outfit(fontSize: 11, color: remembaPaper),
      ),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: remembaAccent,
      foregroundColor: Colors.white,
    ),
  );
}

TextStyle serifStyle({double size = 32, Color color = remembaPaper}) {
  return GoogleFonts.fraunces(
    fontSize: size,
    color: color,
    fontWeight: FontWeight.w500,
    height: 1.12,
  );
}

TextStyle kickerStyle() {
  return GoogleFonts.outfit(
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: FontWeight.w600,
    color: remembaCyan,
  );
}
