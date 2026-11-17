import 'package:flutter/material.dart';
import 'package:rememba/theme.dart';

class AnalysisOverlay extends StatelessWidget {
  const AnalysisOverlay({
    super.key,
    required this.photos,
    required this.events,
    required this.links,
    required this.done,
    required this.onContinue,
  });

  final int photos;
  final int events;
  final int links;
  final bool done;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xF205050A),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(28, 40, 28, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(done ? '✨  J’ai trouvé quelque chose pour vous.' : 'Analyse de vos souvenirs…', style: serifStyle(size: 32)),
              const SizedBox(height: 12),
              const Text(
                'Comptages réels, extraits de votre photothèque. Les visages ne sont pas inventés.',
                style: TextStyle(color: remembaMuted, height: 1.4),
              ),
              const Spacer(),
              _line('◉  $photos photos analysées'),
              _line('◉  0 visages détectés localement'),
              _line('◉  $events événements possibles'),
              _line('◉  $links nouvelles associations'),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: done ? onContinue : null,
                  style: FilledButton.styleFrom(
                    backgroundColor: remembaAccent,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: const StadiumBorder(),
                  ),
                  child: Text(done ? 'Entrer dans ma mémoire' : 'Lecture…'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _line(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Text(text, style: const TextStyle(fontSize: 18, height: 1.3)),
    );
  }
}
