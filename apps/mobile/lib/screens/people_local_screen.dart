import 'package:flutter/material.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/glass.dart';
import 'package:rememba/widgets/memory_bits.dart';

class PeopleLocalScreen extends StatelessWidget {
  const PeopleLocalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
      children: [
        Text('Personnes', style: serifStyle(size: 34)),
        const SizedBox(height: 6),
        const Text(
          'Les portraits circulaires arriveront avec la reconnaissance des visages. Aucun prénom n’est inventé.',
          style: TextStyle(color: remembaMuted, height: 1.4),
        ),
        const SizedBox(height: 28),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            for (final label in ['·', '·', '·', '·'])
              Column(
                children: [
                  Container(
                    width: 68,
                    height: 68,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
                      gradient: LinearGradient(
                        colors: [
                          remembaAccent.withValues(alpha: 0.18),
                          remembaCyan.withValues(alpha: 0.08),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(label, style: const TextStyle(color: remembaMuted)),
                ],
              ),
          ],
        ),
        const SizedBox(height: 18),
        Text('+ 0 personne', style: serifStyle(size: 20), textAlign: TextAlign.center),
        const SizedBox(height: 28),
        const EmptyMemory(
          title: 'Bientôt, une fiche vraie',
          body:
              'Quand un visage sera confirmé par vous : photos, événements, vidéos, dernières apparitions, souvenirs communs. Pas avant.',
        ),
        const SizedBox(height: 16),
        GlassCard(
          child: const Text(
            'Les visages confirmés via un compte (analyse serveur, consentement) resteront des suggestions jusqu’à votre décision.',
            style: TextStyle(color: remembaMuted, height: 1.45),
          ),
        ),
      ],
    );
  }
}
