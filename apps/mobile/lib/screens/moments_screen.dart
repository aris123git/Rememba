import 'package:flutter/material.dart';
import 'package:rememba/local/format.dart';
import 'package:rememba/local/memory_library.dart';
import 'package:rememba/local/memory_model.dart';
import 'package:rememba/screens/event_detail_screen.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/glass.dart';
import 'package:rememba/widgets/memory_bits.dart';

class MomentsScreen extends StatelessWidget {
  const MomentsScreen({super.key, required this.library});
  final MemoryLibrary library;

  @override
  Widget build(BuildContext context) {
    final grouped = eventsByMonth(library.events.where((e) => !library.dismissed.contains(e.id)).toList());
    if (grouped.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(20),
        child: EmptyMemory(
          title: 'Aucun moment pour l’instant',
          body: 'L’IA organise automatiquement la galerie dès qu’un groupe de photos se forme dans le temps.',
        ),
      );
    }
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
      children: [
        Text('Moments', style: serifStyle(size: 34)),
        const SizedBox(height: 6),
        const Text('Une timeline intelligente — pas une grille de carrés.', style: TextStyle(color: remembaMuted)),
        const SizedBox(height: 24),
        for (final month in grouped.entries) ...[
          Text(month.key, style: kickerStyle()),
          const SizedBox(height: 14),
          for (final event in month.value)
            Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: GlassCard(
                padding: const EdgeInsets.all(12),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => EventDetailScreen(library: library, event: event)),
                  );
                },
                child: Row(
                  children: [
                    SizedBox(width: 88, height: 88, child: EventCover(library: library, event: event, height: 88)),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(formatShortDay(event.startsAt), style: const TextStyle(color: remembaCyan, fontSize: 12)),
                          const SizedBox(height: 4),
                          Text(event.title, style: serifStyle(size: 20)),
                          const SizedBox(height: 4),
                          Text('${event.photoCount} photos', style: const TextStyle(color: remembaMuted)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 12),
        ],
      ],
    );
  }
}
