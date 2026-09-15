import 'package:flutter/material.dart';
import 'package:rememba/local/format.dart';
import 'package:rememba/local/memory_library.dart';
import 'package:rememba/local/memory_model.dart';
import 'package:rememba/screens/video_studio_screen.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/asset_thumb.dart';
import 'package:rememba/widgets/glass.dart';
import 'package:rememba/widgets/memory_bits.dart';

class EventDetailScreen extends StatefulWidget {
  const EventDetailScreen({super.key, required this.library, required this.event});
  final MemoryLibrary library;
  final MemoryEvent event;

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  late MemoryEvent event;
  final name = TextEditingController();

  @override
  void initState() {
    super.initState();
    event = widget.event;
    name.text = event.title;
  }

  @override
  void dispose() {
    name.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final assets = widget.library.assetsFor(event);
    return Scaffold(
      appBar: AppBar(title: Text(kindLabel(event.kind))),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        children: [
          EventCover(library: widget.library, event: event, height: 280),
          const SizedBox(height: 20),
          Text(formatDay(event.startsAt), style: kickerStyle()),
          const SizedBox(height: 8),
          Text(event.title, style: serifStyle(size: 32)),
          const SizedBox(height: 8),
          Text(
            'L’IA a regroupé ${event.photoCount} photos proches dans le temps. Le titre reste le vôtre.',
            style: const TextStyle(color: remembaMuted, height: 1.4),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: name,
            decoration: const InputDecoration(labelText: 'Nommer ce souvenir'),
            onSubmitted: (v) async {
              await widget.library.rename(event, v);
              setState(() => event = event.copyWith(title: v));
            },
          ),
          const SizedBox(height: 16),
          AccentButton(
            label: '✦  Créer un souvenir filmé',
            onPressed: assets.isEmpty
                ? null
                : () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => VideoStudioScreen(library: widget.library, event: event),
                      ),
                    );
                  },
          ),
          const SizedBox(height: 28),
          for (var i = 0; i < assets.length; i++) ...[
            GestureDetector(
              onTap: () => openPhotos(context, assets, index: i),
              child: Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: AspectRatio(aspectRatio: 4 / 5, child: AssetThumb(asset: assets[i], size: 900, radius: 26)),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
