import 'package:flutter/material.dart';
import 'package:rememba/local/format.dart';
import 'package:rememba/local/memory_library.dart';
import 'package:rememba/screens/event_detail_screen.dart';
import 'package:rememba/screens/people_local_screen.dart';
import 'package:rememba/screens/settings_screen.dart';
import 'package:rememba/state/session.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/memory_bits.dart';

class CollectionsScreen extends StatelessWidget {
  const CollectionsScreen({super.key, required this.library, required this.session});
  final MemoryLibrary library;
  final SessionController session;

  @override
  Widget build(BuildContext context) {
    final albums = library.events;
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          title: const Text('Collections'),
          actions: [
            IconButton(
              icon: const Icon(Icons.settings_outlined),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => SettingsScreen(session: session, library: library)),
                );
              },
            ),
          ],
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Text('Personnes', style: serifStyle(size: 16)),
          ),
        ),
        SliverToBoxAdapter(
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16),
            leading: CircleAvatar(
              backgroundColor: remembaGlass,
              child: const Icon(Icons.person_outline, color: remembaMuted),
            ),
            title: const Text('Visages'),
            subtitle: const Text('Pas encore détectés sur l’appareil'),
            trailing: const Icon(Icons.chevron_right, color: remembaMuted),
            onTap: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const PeopleLocalScreen()));
            },
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
            child: Text('Albums', style: serifStyle(size: 16)),
          ),
        ),
        if (albums.isEmpty)
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 24),
              child: Text(
                'Les albums se forment quand plusieurs photos sont prises le même jour.',
                style: TextStyle(color: remembaMuted, height: 1.4),
              ),
            ),
          )
        else
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 16,
                crossAxisSpacing: 12,
                childAspectRatio: 0.92,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, i) {
                  final event = albums[i];
                  return GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => EventDetailScreen(library: library, event: event)),
                      );
                    },
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(child: EventCover(library: library, event: event)),
                        const SizedBox(height: 8),
                        Text(event.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w500)),
                        Text(
                          '${formatGalleryDay(event.startsAt)} · ${event.photoCount}',
                          style: const TextStyle(color: remembaMuted, fontSize: 12),
                        ),
                      ],
                    ),
                  );
                },
                childCount: albums.length,
              ),
            ),
          ),
      ],
    );
  }
}
