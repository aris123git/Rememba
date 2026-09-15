import 'package:flutter/material.dart';
import 'package:rememba/local/memory_library.dart';
import 'package:rememba/screens/event_detail_screen.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/glass.dart';
import 'package:rememba/widgets/memory_bits.dart';

const _catalog = [
  ('FETE', '🎂', 'ANNIVERSAIRE'),
  ('MARIAGE', '💍', 'MARIAGE'),
  ('VOYAGE', '✈️', 'VOYAGE'),
  ('CEREMONIE', '🎓', 'CÉRÉMONIE'),
  ('CONCERT', '🎤', 'CONCERT'),
  ('JOURNEE', '☀️', 'JOURNÉE'),
  ('SOUVENIR', '✨', 'SOUVENIR'),
];

class EventsLocalScreen extends StatelessWidget {
  const EventsLocalScreen({super.key, required this.library});
  final MemoryLibrary library;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
      children: [
        Text('Événements', style: serifStyle(size: 34)),
        const SizedBox(height: 6),
        const Text('De grandes cartes visuelles, classées par ce que l’IA peut vraiment inférer.', style: TextStyle(color: remembaMuted)),
        const SizedBox(height: 22),
        for (final item in _catalog)
          _KindCard(
            library: library,
            kind: item.$1,
            emoji: item.$2,
            label: item.$3,
          ),
      ],
    );
  }
}

class _KindCard extends StatelessWidget {
  const _KindCard({required this.library, required this.kind, required this.emoji, required this.label});
  final MemoryLibrary library;
  final String kind;
  final String emoji;
  final String label;

  @override
  Widget build(BuildContext context) {
    final matches = library.events.where((e) => e.kind == kind && !library.dismissed.contains(e.id)).toList();
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: GlassCard(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('$emoji  $label', style: serifStyle(size: 26)),
            const SizedBox(height: 6),
            Text(
              matches.isEmpty
                  ? 'Pas encore détecté dans votre photothèque.'
                  : '${matches.length} moment${matches.length > 1 ? 's' : ''} · ${matches.fold<int>(0, (n, e) => n + e.photoCount)} photos',
              style: const TextStyle(color: remembaMuted),
            ),
            if (matches.isNotEmpty) ...[
              const SizedBox(height: 12),
              EventCover(library: library, event: matches.first, height: 140),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => EventDetailScreen(library: library, event: matches.first),
                      ),
                    );
                  },
                  child: const Text('Ouvrir'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
