import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:rememba/theme.dart';

class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.onTap,
    this.glow = false,
  });

  final Widget child;
  final EdgeInsets padding;
  final VoidCallback? onTap;
  final bool glow;

  @override
  Widget build(BuildContext context) {
    final card = ClipRRect(
      borderRadius: BorderRadius.circular(28),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            color: Colors.white.withValues(alpha: glow ? 0.09 : 0.055),
            border: Border.all(color: Colors.white.withValues(alpha: glow ? 0.18 : 0.08)),
            boxShadow: glow
                ? [BoxShadow(color: remembaAccent.withValues(alpha: 0.22), blurRadius: 28, offset: const Offset(0, 12))]
                : null,
          ),
          child: Padding(padding: padding, child: child),
        ),
      ),
    );
    if (onTap == null) return card;
    return GestureDetector(onTap: onTap, child: card);
  }
}

class AccentButton extends StatelessWidget {
  const AccentButton({super.key, required this.label, required this.onPressed, this.filled = true});
  final String label;
  final VoidCallback? onPressed;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    if (!filled) {
      return TextButton(onPressed: onPressed, child: Text(label, style: const TextStyle(color: remembaMuted)));
    }
    return FilledButton(
      onPressed: onPressed,
      style: FilledButton.styleFrom(
        backgroundColor: remembaAccent,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        shape: const StadiumBorder(),
      ),
      child: Text(label),
    );
  }
}
