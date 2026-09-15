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
  const EventCover({super.key, required this.library, required this.event, this.height = 220});
  final MemoryLibrary library;
  final MemoryEvent event;
  final double height;

  @override
  Widget build(BuildContext context) {
    final asset = library.assetFor(event.photoIds.first);
    return SizedBox(
      height: height,
      width: double.infinity,
      child: asset == null
          ? const ColoredBox(color: remembaInkSoft)
          : AssetThumb(asset: asset, size: 800, radius: 28),
    );
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
            child: SizedBox(width: 86, child: AssetThumb(asset: assets[i], radius: 20)),
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
        Text('${kindEmoji(event.kind)}  ${kindLabel(event.kind).toUpperCase()}', style: kickerStyle()),
        const SizedBox(height: 8),
        Text(event.title, style: serifStyle(size: large ? 28 : 22)),
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
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(999),
          color: selected ? remembaAccent.withValues(alpha: 0.28) : remembaGlass,
          border: Border.all(color: selected ? remembaAccent : Colors.white.withValues(alpha: 0.08)),
        ),
        child: Text(label, style: TextStyle(color: selected ? remembaPaper : remembaMuted, fontWeight: FontWeight.w500)),
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
