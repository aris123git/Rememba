import 'package:flutter/material.dart';
import 'package:rememba/theme.dart';

class PeopleLocalScreen extends StatelessWidget {
  const PeopleLocalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Personnes')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        children: [
          const Text(
            'Aucun visage n’est encore reconnu sur cet appareil. Rememba n’invente pas de prénoms.',
            style: TextStyle(color: remembaMuted, height: 1.45),
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              for (var i = 0; i < 4; i++)
                const CircleAvatar(radius: 36, backgroundColor: remembaGlass, child: Icon(Icons.person_outline, color: remembaMuted)),
            ],
          ),
        ],
      ),
    );
  }
}
