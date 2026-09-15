import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

/// Google Photos–like: white canvas, ink text, one quiet blue.
const remembaInk = Color(0xFF202124);
const remembaInkSoft = Color(0xFFE8EAED);
const remembaPaper = Color(0xFFFFFFFF);
const remembaMuted = Color(0xFF5F6368);
const remembaAccent = Color(0xFF1A73E8);
const remembaCyan = remembaAccent;
const remembaGold = remembaAccent;
const remembaDanger = Color(0xFFD93025);
const remembaGlass = Color(0xFFF1F3F4);
const remembaBar = Color(0xFFF8F9FA);

ThemeData remembaTheme() {
  final text = GoogleFonts.notoSansTextTheme().apply(
    bodyColor: remembaInk,
    displayColor: remembaInk,
  );
  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: remembaPaper,
    colorScheme: const ColorScheme.light(
      surface: remembaPaper,
      primary: remembaAccent,
      onPrimary: Colors.white,
      secondary: remembaAccent,
      error: remembaDanger,
      onSurface: remembaInk,
    ),
  );
  return base.copyWith(
    textTheme: text,
    appBarTheme: AppBarTheme(
      backgroundColor: remembaPaper,
      foregroundColor: remembaInk,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      surfaceTintColor: Colors.transparent,
      systemOverlayStyle: SystemUiOverlayStyle.dark,
      titleTextStyle: GoogleFonts.notoSans(
        color: remembaInk,
        fontSize: 22,
        fontWeight: FontWeight.w500,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: remembaGlass,
      hintStyle: GoogleFonts.notoSans(color: remembaMuted, fontSize: 16),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: remembaAccent, width: 1.5),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: remembaPaper,
      elevation: 0,
      height: 64,
      indicatorColor: const Color(0xFFD2E3FC),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return GoogleFonts.notoSans(
          fontSize: 12,
          fontWeight: selected ? FontWeight.w500 : FontWeight.w400,
          color: selected ? remembaAccent : remembaMuted,
        );
      }),
    ),
    dividerColor: const Color(0xFFDADCE0),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: remembaAccent,
      foregroundColor: Colors.white,
    ),
  );
}

TextStyle serifStyle({double size = 22, Color? color}) {
  return GoogleFonts.notoSans(
    fontSize: size,
    color: color ?? remembaInk,
    fontWeight: FontWeight.w500,
    height: 1.25,
    letterSpacing: -0.2,
  );
}

TextStyle kickerStyle() {
  return GoogleFonts.notoSans(
    fontSize: 13,
    fontWeight: FontWeight.w500,
    color: remembaMuted,
  );
}

TextStyle dateHeaderStyle() {
  return GoogleFonts.notoSans(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: remembaInk,
  );
}
