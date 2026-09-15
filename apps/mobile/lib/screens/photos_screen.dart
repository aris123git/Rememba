import 'package:flutter/material.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:rememba/local/format.dart';
import 'package:rememba/local/memory_library.dart';
import 'package:rememba/screens/event_detail_screen.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/asset_thumb.dart';
import 'package:rememba/widgets/memory_bits.dart';

class PhotosScreen extends StatelessWidget {
  const PhotosScreen({super.key, required this.library, this.onSearch});
  final MemoryLibrary library;
  final VoidCallback? onSearch;

  @override
  Widget build(BuildContext context) {
    final sections = groupByDay(library.assets, (a) => a.createDateTime);
    final memories = library.events.take(8).toList();

    if (library.assets.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Text(
            'Aucune photo sur cet appareil pour l’instant.',
            textAlign: TextAlign.center,
            style: TextStyle(color: remembaMuted, height: 1.4),
          ),
        ),
      );
    }

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: Material(
              color: remembaGlass,
              borderRadius: BorderRadius.circular(8),
              child: InkWell(
                onTap: onSearch,
                borderRadius: BorderRadius.circular(8),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Row(
                    children: [
                      Icon(Icons.search, color: remembaMuted, size: 22),
                      SizedBox(width: 12),
                      Text('Rechercher dans vos photos', style: TextStyle(color: remembaMuted, fontSize: 16)),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
        if (library.limited)
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Text(
                'Accès limité. Autorisez plus de photos dans les réglages du téléphone.',
                style: TextStyle(color: remembaMuted, fontSize: 13),
              ),
            ),
          ),
        if (memories.isNotEmpty)
          SliverToBoxAdapter(
            child: SizedBox(
              height: 168,
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                scrollDirection: Axis.horizontal,
                itemCount: memories.length,
                separatorBuilder: (context, _) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  final event = memories[i];
                  return GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => EventDetailScreen(library: library, event: event)),
                      );
                    },
                    child: SizedBox(
                      width: 118,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: EventCover(library: library, event: event)),
                          const SizedBox(height: 6),
                          Text(
                            formatGalleryDay(event.startsAt),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                          ),
                          Text(
                            '${event.photoCount} photos',
                            style: const TextStyle(fontSize: 11, color: remembaMuted),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        for (final section in sections) ...[
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
              child: Text(formatGalleryDay(section.day), style: dateHeaderStyle()),
            ),
          ),
          SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 2,
              crossAxisSpacing: 2,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, i) {
                final asset = section.items[i];
                return GestureDetector(
                  onTap: () => openPhotos(context, _flat(sections), index: _indexOf(sections, asset)),
                  child: AssetThumb(asset: asset, size: 280),
                );
              },
              childCount: section.items.length,
            ),
          ),
        ],
        const SliverToBoxAdapter(child: SizedBox(height: 24)),
      ],
    );
  }

  static List<AssetEntity> _flat(List<DaySection<AssetEntity>> sections) {
    return [for (final s in sections) ...s.items];
  }

  static int _indexOf(List<DaySection<AssetEntity>> sections, AssetEntity asset) {
    return _flat(sections).indexWhere((a) => a.id == asset.id);
  }
}
