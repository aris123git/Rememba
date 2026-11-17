import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:rememba/local/format.dart';
import 'package:rememba/theme.dart';

class AssetThumb extends StatelessWidget {
  const AssetThumb({super.key, required this.asset, this.size = 300, this.radius = 0});
  final AssetEntity asset;
  final int size;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: FutureBuilder<Uint8List?>(
        future: asset.thumbnailDataWithSize(ThumbnailSize.square(size)),
        builder: (context, snapshot) {
          final bytes = snapshot.data;
          if (bytes == null) return const ColoredBox(color: remembaInkSoft);
          return Image.memory(bytes, fit: BoxFit.cover, width: double.infinity, height: double.infinity, gaplessPlayback: true);
        },
      ),
    );
  }
}

class PhotoViewer extends StatefulWidget {
  const PhotoViewer({super.key, required this.assets, required this.index});
  final List<AssetEntity> assets;
  final int index;

  @override
  State<PhotoViewer> createState() => _PhotoViewerState();
}

class _PhotoViewerState extends State<PhotoViewer> {
  late final PageController controller;
  late int current;

  @override
  void initState() {
    super.initState();
    current = widget.index;
    controller = PageController(initialPage: widget.index);
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final taken = widget.assets[current].createDateTime;
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text('${current + 1} / ${widget.assets.length}', style: const TextStyle(color: Colors.white, fontSize: 16)),
      ),
      body: Column(
        children: [
          Expanded(
            child: PageView.builder(
              controller: controller,
              itemCount: widget.assets.length,
              onPageChanged: (i) => setState(() => current = i),
              itemBuilder: (context, i) => FutureBuilder(
                future: widget.assets[i].file,
                builder: (context, snapshot) {
                  final file = snapshot.data;
                  if (file == null) {
                    return const Center(child: CircularProgressIndicator(color: remembaAccent));
                  }
                  return InteractiveViewer(child: Center(child: Image.file(file, fit: BoxFit.contain)));
                },
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
            child: Text(
              formatDay(taken),
              style: const TextStyle(color: Colors.white70),
            ),
          ),
        ],
      ),
    );
  }
}
