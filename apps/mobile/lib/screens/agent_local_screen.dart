import 'package:flutter/material.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:rememba/local/agent_local.dart';
import 'package:rememba/local/memory_library.dart';
import 'package:rememba/screens/event_detail_screen.dart';
import 'package:rememba/screens/video_studio_screen.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/asset_thumb.dart';
import 'package:rememba/widgets/memory_bits.dart';

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
    final photos = <AssetEntity>[
      for (final event in reply?.events ?? const []) ...widget.library.assetsFor(event),
    ];
    return Scaffold(
      body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
              child: Row(
                children: [
                  if (Navigator.of(context).canPop())
                    IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.arrow_back)),
                  Expanded(
                    child: TextField(
                      controller: input,
                      autofocus: false,
                      textInputAction: TextInputAction.search,
                      onSubmitted: (_) => _ask(),
                      decoration: const InputDecoration(
                        hintText: 'Rechercher dans vos photos',
                        prefixIcon: Icon(Icons.search, color: remembaMuted),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (reply == null)
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  children: [
                    const Text('Raccourcis', style: TextStyle(color: remembaMuted, fontSize: 13)),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        SoftChip(label: 'Voyages', onTap: () => _ask('voyage')),
                        SoftChip(label: '2025', onTap: () => _ask('2025')),
                        SoftChip(label: 'Septembre', onTap: () => _ask('septembre')),
                      ],
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Les personnes apparaîtront ici une fois les visages confirmés. Aucun nom n’est inventé.',
                      style: TextStyle(color: remembaMuted, height: 1.4),
                    ),
                  ],
                ),
              )
            else
              Expanded(
                child: ListView(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                      child: Text(reply!.text, style: const TextStyle(color: remembaMuted, height: 1.4)),
                    ),
                    if (reply!.openVideo && reply!.events.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: FilledButton(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => VideoStudioScreen(library: widget.library, event: reply!.events.first),
                                ),
                              );
                            },
                            child: const Text('Créer un film'),
                          ),
                        ),
                      ),
                    if (photos.isEmpty)
                      for (final event in reply!.events)
                        ListTile(
                          leading: SizedBox(width: 56, height: 56, child: EventCover(library: widget.library, event: event)),
                          title: Text(event.title),
                          subtitle: Text('${event.photoCount} photos'),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => EventDetailScreen(library: widget.library, event: event),
                              ),
                            );
                          },
                        )
                    else
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: photos.length,
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          mainAxisSpacing: 2,
                          crossAxisSpacing: 2,
                        ),
                        itemBuilder: (context, i) {
                          return GestureDetector(
                            onTap: () => openPhotos(context, photos, index: i),
                            child: AssetThumb(asset: photos[i], size: 280),
                          );
                        },
                      ),
                  ],
                ),
              ),
          ],
        ),
    );
  }
}
