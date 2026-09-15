import 'package:flutter/material.dart';
import 'package:rememba/local/agent_local.dart';
import 'package:rememba/local/memory_library.dart';
import 'package:rememba/screens/event_detail_screen.dart';
import 'package:rememba/screens/video_studio_screen.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/glass.dart';
import 'package:rememba/widgets/memory_bits.dart';

const _hints = [
  'Montre-moi mes voyages',
  'Fais-moi une vidéo de ce moment',
  'Quels sont mes meilleurs souvenirs de 2025 ?',
  'Photos de septembre',
];

class AgentLocalScreen extends StatefulWidget {
  const AgentLocalScreen({super.key, required this.library});
  final MemoryLibrary library;

  @override
  State<AgentLocalScreen> createState() => _AgentLocalScreenState();
}

class _AgentLocalScreenState extends State<AgentLocalScreen> {
  final input = TextEditingController();
  LocalAgentReply? reply;

  @override
  void dispose() {
    input.dispose();
    super.dispose();
  }

  void _ask([String? preset]) {
    final text = (preset ?? input.text).trim();
    if (text.isEmpty) return;
    input.text = text;
    setState(() {
      reply = interpretQuery(text, widget.library.events, photoCount: widget.library.photoCount);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Assistant')),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
              children: [
                Text('Que voulez-vous retrouver ?', style: serifStyle(size: 34)),
                const SizedBox(height: 10),
                const Text(
                  'Écrivez comme à un assistant, pas comme dans un moteur de recherche.',
                  style: TextStyle(color: remembaMuted, height: 1.4),
                ),
                const SizedBox(height: 20),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [for (final h in _hints) SoftChip(label: h, onTap: () => _ask(h))],
                ),
                if (reply != null) ...[
                  const SizedBox(height: 28),
                  GlassCard(
                    glow: true,
                    child: Text(reply!.text, style: const TextStyle(height: 1.45, fontSize: 16)),
                  ),
                  const SizedBox(height: 16),
                  for (final event in reply!.events)
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
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            EventCover(library: widget.library, event: event, height: 160),
                            const SizedBox(height: 12),
                            EventMeta(event: event),
                          ],
                        ),
                      ),
                    ),
                  if (reply!.openVideo && reply!.events.isNotEmpty)
                    AccentButton(
                      label: 'Ouvrir le studio vidéo',
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => VideoStudioScreen(library: widget.library, event: reply!.events.first),
                          ),
                        );
                      },
                    ),
                ],
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                boxShadow: [BoxShadow(color: remembaAccent.withValues(alpha: 0.35), blurRadius: 24)],
              ),
              child: TextField(
                controller: input,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _ask(),
                decoration: InputDecoration(
                  hintText: 'Décrivez un souvenir…',
                  suffixIcon: IconButton(
                    onPressed: _ask,
                    icon: const Icon(Icons.arrow_upward_rounded, color: remembaPaper),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
