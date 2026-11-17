import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:rememba/theme.dart';

class MemoryMark extends StatelessWidget {
  const MemoryMark({super.key, this.size = 36});
  final double size;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size.square(size),
      painter: _MarkPainter(),
    );
  }
}

class _MarkPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final c = Offset(size.width / 2, size.height / 2);
    final accent = Paint()
      ..color = remembaAccent
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;
    final cyan = Paint()
      ..color = remembaCyan.withValues(alpha: 0.85)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(c, size.width * 0.42, accent);
    canvas.drawCircle(c, size.width * 0.12, Paint()..color = remembaPaper.withValues(alpha: 0.9));
    for (var i = 0; i < 7; i++) {
      final a = (i / 7) * math.pi * 2 - math.pi / 2;
      final p = Offset(c.dx + math.cos(a) * size.width * 0.28, c.dy + math.sin(a) * size.width * 0.28);
      canvas.drawCircle(p, i == 0 ? 2.6 : 1.7, cyan);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
