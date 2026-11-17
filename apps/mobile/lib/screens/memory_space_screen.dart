import 'package:flutter/material.dart';
import 'package:rememba/local/memory_library.dart';
import 'package:rememba/local/memory_model.dart';
import 'package:rememba/screens/event_detail_screen.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/glass.dart';
import 'package:rememba/widgets/memory_bits.dart';
import 'package:rememba/widgets/memory_mark.dart';

class MemorySpaceScreen extends StatefulWidget {
  const MemorySpaceScreen({super.key, required this.library});
  final MemoryLibrary library;

  @override
  State<MemorySpaceScreen> createState() => _MemorySpaceScreenState();
}

class _MemorySpaceScreenState extends State<MemorySpaceScreen> {
  String? selected;

  @override
  Widget build(BuildContext context) {
    final events = widget.library.events.where((e) => !widget.library.dismissed.contains(e.id)).toList();
    final nodes = [
      _Node('Voyages', 'VOYAGE', events.where((e) => e.kind == 'VOYAGE').length),
      _Node('Célébrations', 'FETE', events.where((e) => e.kind == 'FETE').length),
      _Node('Journées', 'JOURNEE', events.where((e) => e.kind == 'JOURNEE').length),
      _Node('Souvenirs', 'SOUVENIR', events.where((e) => e.kind == 'SOUVENIR').length),
    ];
    final filtered = selected == null ? const <MemoryEvent>[] : events.where((e) => e.kind == selected).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Memory Space')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        children: [
          const Center(child: MemoryMark(size: 72)),
          const SizedBox(height: 12),
          Text('VOUS', style: serifStyle(size: 28), textAlign: TextAlign.center),
          const SizedBox(height: 6),
          const Text(
            'L’IA construit cette carte progressivement : personnes → événements → photos → vidéos.',
            textAlign: TextAlign.center,
            style: TextStyle(color: remembaMuted, height: 1.4),
          ),
          const SizedBox(height: 28),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 12,
            runSpacing: 12,
            children: [
              for (final node in nodes)
                GlassCard(
                  glow: selected == node.kind,
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                  onTap: () => setState(() => selected = selected == node.kind ? null : node.kind),
                  child: Column(
                    children: [
                      Text(node.label, style: serifStyle(size: 18)),
                      const SizedBox(height: 4),
                      Text('${node.count}', style: const TextStyle(color: remembaCyan)),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 28),
          if (selected == null)
            const EmptyMemory(
              title: 'Choisissez un groupe',
              body: 'Famille, amis et travail apparaîtront quand des personnes seront confirmées. Pour l’instant : voyages, fêtes, journées.',
            )
          else if (filtered.isEmpty)
            EmptyMemory(
              title: kindLabel(selected!),
              body: 'Pas encore de photos regroupées dans cette branche.',
            )
          else
            for (final event in filtered)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: GlassCard(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => EventDetailScreen(library: widget.library, event: event),
                      ),
                    );
                  },
                  child: EventMeta(event: event),
                ),
              ),
        ],
      ),
    );
  }
}

class _Node {
  const _Node(this.label, this.kind, this.count);
  final String label;
  final String kind;
  final int count;
}
