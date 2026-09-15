import 'package:flutter/material.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:rememba/local/format.dart';
import 'package:rememba/local/memory_library.dart';
import 'package:rememba/local/memory_model.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/asset_thumb.dart';
import 'package:rememba/widgets/glass.dart';

void openPhotos(BuildContext context, List<AssetEntity> assets, {int index = 0}) {
  if (assets.isEmpty) return;
  Navigator.push(
    context,
    MaterialPageRoute(builder: (_) => PhotoViewer(assets: assets, index: index)),
  );
}

class EventCover extends StatelessWidget {
  const EventCover({super.key, required this.library, required this.event, this.height});
  final MemoryLibrary library;
  final MemoryEvent event;
  final double? height;

  @override
  Widget build(BuildContext context) {
    final asset = library.assetFor(event.photoIds.first);
    final child = ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: asset == null
          ? const ColoredBox(color: remembaInkSoft)
          : AssetThumb(asset: asset, size: 800, radius: 8),
    );
    if (height == null) return child;
    return SizedBox(height: height, width: double.infinity, child: child);
  }
}

class EventPhotoStrip extends StatelessWidget {
  const EventPhotoStrip({super.key, required this.library, required this.event});
  final MemoryLibrary library;
  final MemoryEvent event;

  @override
  Widget build(BuildContext context) {
    final assets = library.assetsFor(event);
    return SizedBox(
      height: 108,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: assets.length.clamp(0, 12),
        separatorBuilder: (context, _) => const SizedBox(width: 10),
        itemBuilder: (context, i) {
          return GestureDetector(
            onTap: () => openPhotos(context, assets, index: i),
            child: SizedBox(width: 86, child: AssetThumb(asset: assets[i], radius: 8)),
          );
        },
      ),
    );
  }
}

class EventMeta extends StatelessWidget {
  const EventMeta({super.key, required this.event, this.large = false});
  final MemoryEvent event;
  final bool large;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(kindLabel(event.kind), style: kickerStyle()),
        const SizedBox(height: 4),
        Text(event.title, style: serifStyle(size: large ? 22 : 16)),
        const SizedBox(height: 6),
        Text(
          '${formatDay(event.startsAt)}  ·  ${event.photoCount} photos',
          style: const TextStyle(color: remembaMuted),
        ),
      ],
    );
  }
}

class SoftChip extends StatelessWidget {
  const SoftChip({super.key, required this.label, this.selected = false, this.onTap});
  final String label;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          color: selected ? const Color(0xFFD2E3FC) : remembaGlass,
        ),
        child: Text(label, style: TextStyle(color: selected ? remembaAccent : remembaInk, fontWeight: FontWeight.w500, fontSize: 13)),
      ),
    );
  }
}

class EmptyMemory extends StatelessWidget {
  const EmptyMemory({super.key, required this.title, required this.body});
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: serifStyle(size: 24)),
          const SizedBox(height: 8),
          Text(body, style: const TextStyle(color: remembaMuted, height: 1.45)),
        ],
      ),
    );
  }
}
