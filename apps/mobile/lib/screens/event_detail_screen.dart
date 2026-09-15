import 'package:flutter/material.dart';
import 'package:rememba/local/format.dart';
import 'package:rememba/local/memory_library.dart';
import 'package:rememba/local/memory_model.dart';
import 'package:rememba/screens/video_studio_screen.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/asset_thumb.dart';
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
      appBar: AppBar(
        title: Text(event.title, overflow: TextOverflow.ellipsis),
        actions: [
          IconButton(
            tooltip: 'Film',
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
            icon: const Icon(Icons.movie_outlined),
          ),
        ],
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${formatDay(event.startsAt)} · ${event.photoCount} photos', style: kickerStyle()),
                  const SizedBox(height: 12),
                  TextField(
                    controller: name,
                    decoration: const InputDecoration(hintText: 'Nom de l’album'),
                    onSubmitted: (v) async {
                      await widget.library.rename(event, v);
                      setState(() => event = event.copyWith(title: v));
                    },
                  ),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: EdgeInsets.zero,
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                mainAxisSpacing: 2,
                crossAxisSpacing: 2,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, i) {
                  return GestureDetector(
                    onTap: () => openPhotos(context, assets, index: i),
                    child: AssetThumb(asset: assets[i], size: 320),
                  );
                },
                childCount: assets.length,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
