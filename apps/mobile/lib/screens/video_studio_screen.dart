import 'dart:async';

import 'package:flutter/material.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:rememba/local/format.dart';
import 'package:rememba/local/memory_library.dart';
import 'package:rememba/local/memory_model.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/asset_thumb.dart';
import 'package:rememba/widgets/glass.dart';
import 'package:rememba/widgets/memory_bits.dart';

const _styles = ['Cinéma', 'Émotion', 'Festif', 'Dynamique'];

class VideoStudioScreen extends StatefulWidget {
  const VideoStudioScreen({super.key, required this.library, required this.event});
  final MemoryLibrary library;
  final MemoryEvent event;

  @override
  State<VideoStudioScreen> createState() => _VideoStudioScreenState();
}

class _VideoStudioScreenState extends State<VideoStudioScreen> {
  String style = 'Cinéma';
  String? music;
  bool generating = false;
  bool ready = false;
  int page = 0;
  Timer? timer;
  late final PageController pager;

  List<AssetEntity> get assets => widget.library.assetsFor(widget.event);
  int get seconds => (assets.length * (style == 'Dynamique' ? 1.2 : 2.1)).round().clamp(8, 180);

  @override
  void initState() {
    super.initState();
    pager = PageController();
    _play();
  }

  void _play() {
    timer?.cancel();
    final ms = style == 'Dynamique' ? 1100 : 2100;
    timer = Timer.periodic(Duration(milliseconds: ms), (_) {
      if (!mounted || assets.isEmpty) return;
      page = (page + 1) % assets.length;
      pager.animateToPage(page, duration: const Duration(milliseconds: 700), curve: Curves.easeInOut);
      setState(() {});
    });
  }

  @override
  void dispose() {
    timer?.cancel();
    pager.dispose();
    super.dispose();
  }

  Future<void> _generate() async {
    setState(() {
      generating = true;
      ready = false;
    });
    await Future<void>.delayed(const Duration(milliseconds: 1600));
    if (!mounted) return;
    setState(() {
      generating = false;
      ready = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    final event = widget.event;
    final overlay = switch (style) {
      'Émotion' => const Color(0x33C9A227),
      'Festif' => remembaAccent.withValues(alpha: 0.18),
      'Dynamique' => remembaCyan.withValues(alpha: 0.12),
      _ => const Color(0x22000000),
    };
    return Scaffold(
      appBar: AppBar(title: const Text('Film')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: AspectRatio(
              aspectRatio: 9 / 12,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (assets.isEmpty)
                    const ColoredBox(color: remembaInkSoft)
                  else
                    PageView.builder(
                      controller: pager,
                      itemCount: assets.length,
                      onPageChanged: (i) => page = i,
                      itemBuilder: (context, i) => AssetThumb(asset: assets[i], size: 1200, radius: 0),
                    ),
                  ColoredBox(color: overlay),
                  if (generating)
                    const ColoredBox(
                      color: Color(0x9905050A),
                      child: Center(child: CircularProgressIndicator(color: remembaAccent)),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 22),
          Text(event.title, style: kickerStyle()),
          const SizedBox(height: 8),
          Text(formatClock(seconds), style: serifStyle(size: 28)),
          if (ready)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Text('Souvenir prêt — lecture locale, sans envoi.', style: TextStyle(color: remembaCyan)),
            ),
          const SizedBox(height: 24),
          const Text('Style', style: TextStyle(color: remembaMuted)),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final s in _styles)
                SoftChip(
                  label: s,
                  selected: style == s,
                  onTap: () {
                    setState(() => style = s);
                    _play();
                  },
                ),
            ],
          ),
          const SizedBox(height: 22),
          const Text('Musique', style: TextStyle(color: remembaMuted)),
          const SizedBox(height: 10),
          GlassCard(
            onTap: () async {
              final choice = await showModalBottomSheet<String>(
                context: context,
                backgroundColor: remembaInkSoft,
                builder: (context) => SafeArea(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      for (final m in ['Silence', 'Piano discret', 'Souffle doux', 'Pulse léger'])
                        ListTile(
                          title: Text(m),
                          onTap: () => Navigator.pop(context, m),
                        ),
                    ],
                  ),
                ),
              );
              if (choice != null) setState(() => music = choice);
            },
            child: Text(music == null ? 'Choisir une musique' : music!, style: serifStyle(size: 16)),
          ),
          const SizedBox(height: 22),
          Text('Photos', style: const TextStyle(color: remembaMuted)),
          const SizedBox(height: 8),
          Text('${event.photoCount} sélectionnées', style: serifStyle(size: 22)),
          const SizedBox(height: 8),
          EventPhotoStrip(library: widget.library, event: event),
          const SizedBox(height: 22),
          const Text('Personnes', style: TextStyle(color: remembaMuted)),
          const SizedBox(height: 8),
          const Text(
            'Aucun visage n’est encore nommé sur l’appareil.',
            style: TextStyle(color: remembaMuted),
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: generating ? null : _generate,
              style: FilledButton.styleFrom(
                backgroundColor: remembaAccent,
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: const StadiumBorder(),
              ),
              child: Text(generating ? 'Composition…' : 'Générer le film'),
            ),
          ),
        ],
      ),
    );
  }
}
