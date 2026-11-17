import 'package:flutter/material.dart';
import 'package:rememba/local/format.dart';
import 'package:rememba/local/memory_library.dart';
import 'package:rememba/local/memory_model.dart';
import 'package:rememba/screens/event_detail_screen.dart';
import 'package:rememba/screens/memory_space_screen.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/glass.dart';
import 'package:rememba/widgets/memory_bits.dart';

class MemoryHomeScreen extends StatelessWidget {
  const MemoryHomeScreen({super.key, required this.library, required this.onOpenPeople});
  final MemoryLibrary library;
  final VoidCallback onOpenPeople;

  @override
  Widget build(BuildContext context) {
    final name = library.displayName;
    final hello = name.isEmpty ? 'Bonjour' : 'Bonjour, $name';
    final hero = library.hero;
    final suggestions = library.suggestions;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
      children: [
        Text(hello, style: serifStyle(size: 36)),
        const SizedBox(height: 6),
        const Text('Votre mémoire évolue avec vous.', style: TextStyle(color: remembaMuted, letterSpacing: 0.2)),
        if (library.limited) ...[
          const SizedBox(height: 12),
          const Text(
            'Accès limité à certaines photos. Vous pouvez en autoriser davantage dans les réglages du téléphone.',
            style: TextStyle(color: remembaCyan, height: 1.35),
          ),
        ],
        const SizedBox(height: 28),
        if (hero == null)
          const EmptyMemory(
            title: 'Pas encore de moment groupé',
            body:
                'Quand plusieurs photos sont prises dans la même fenêtre de temps, Rememba les relie. Aucun titre personnel n’est inventé.',
          )
        else
          _HeroCard(library: library, event: hero),
        const SizedBox(height: 32),
        Text('✨  Suggestions de l’IA', style: serifStyle(size: 22)),
        const SizedBox(height: 6),
        const Text('L’IA propose. Vous décidez.', style: TextStyle(color: remembaMuted)),
        const SizedBox(height: 14),
        if (suggestions.isEmpty)
          const EmptyMemory(
            title: 'Rien à proposer pour l’instant',
            body: 'Autorisez la photothèque, ou prenez quelques photos le même jour.',
          )
        else
          SizedBox(
            height: 210,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: suggestions.length,
              separatorBuilder: (context, _) => const SizedBox(width: 12),
              itemBuilder: (context, i) {
                return SizedBox(
                  width: 280,
                  child: _SuggestionCard(
                    library: library,
                    suggestion: suggestions[i],
                    onPeople: onOpenPeople,
                  ),
                );
              },
            ),
          ),
        const SizedBox(height: 32),
        GlassCard(
          glow: true,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => MemorySpaceScreen(library: library)),
            );
          },
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('MEMORY SPACE', style: kickerStyle()),
              const SizedBox(height: 8),
              Text('Votre mémoire, comme une carte vivante.', style: serifStyle(size: 24)),
              const SizedBox(height: 8),
              const Text(
                'Vous au centre, puis voyages, célébrations, journées — construits progressivement.',
                style: TextStyle(color: remembaMuted, height: 1.4),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.library, required this.event});
  final MemoryLibrary library;
  final MemoryEvent event;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      glow: true,
      padding: const EdgeInsets.all(14),
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => EventDetailScreen(library: library, event: event)),
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          EventCover(library: library, event: event, height: 200),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 16, 10, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('✨  NOUVEAU SOUVENIR', style: kickerStyle()),
                const SizedBox(height: 8),
                Text(formatDay(event.startsAt), style: const TextStyle(color: remembaMuted)),
                const SizedBox(height: 12),
                Text(
                  'L’IA a trouvé ${event.photoCount} photos qui semblent appartenir au même événement.',
                  style: const TextStyle(height: 1.4),
                ),
                const SizedBox(height: 10),
                Text(event.title, style: serifStyle(size: 26)),
                const SizedBox(height: 12),
                const Text('Voir les photos  →', style: TextStyle(color: remembaCyan)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SuggestionCard extends StatelessWidget {
  const _SuggestionCard({required this.library, required this.suggestion, required this.onPeople});
  final MemoryLibrary library;
  final MemorySuggestion suggestion;
  final VoidCallback onPeople;

  @override
  Widget build(BuildContext context) {
    final isPeople = suggestion.kind == 'PERSONNES';
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(isPeople ? '👥  ${suggestion.title}' : '✨  ${suggestion.title}', style: kickerStyle()),
          const SizedBox(height: 10),
          Expanded(child: Text(suggestion.body, style: const TextStyle(height: 1.35))),
          Row(
            children: [
              if (!isPeople)
                TextButton(
                  onPressed: () => library.accept(suggestion.eventId),
                  child: const Text('Accepter'),
                ),
              TextButton(
                onPressed: () {
                  if (isPeople) {
                    onPeople();
                    return;
                  }
                  final event = library.events.where((e) => e.id == suggestion.eventId).firstOrNull;
                  if (event == null) return;
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => EventDetailScreen(library: library, event: event)),
                  );
                },
                child: const Text('Voir'),
              ),
              TextButton(
                onPressed: () => library.dismiss(isPeople ? suggestion.id : suggestion.eventId),
                child: const Text('Ignorer', style: TextStyle(color: remembaMuted)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
