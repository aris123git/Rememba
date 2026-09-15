import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:rememba/screens/settings_screen.dart';
import 'package:rememba/state/session.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/common.dart';

class LocalGalleryHome extends StatefulWidget {
  const LocalGalleryHome({super.key, required this.session});
  final SessionController session;

  @override
  State<LocalGalleryHome> createState() => _LocalGalleryHomeState();
}

class _LocalGalleryHomeState extends State<LocalGalleryHome> {
  PermissionState? permission;
  List<AssetEntity> assets = [];
  bool loading = true;
  String? error;
  bool limited = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final state = await PhotoManager.requestPermissionExtend();
      if (!state.hasAccess) {
        setState(() {
          permission = state;
          assets = [];
          loading = false;
        });
        return;
      }
      final paths = await PhotoManager.getAssetPathList(
        type: RequestType.image,
        onlyAll: true,
      );
      if (paths.isEmpty) {
        setState(() {
          permission = state;
          assets = [];
          loading = false;
          limited = state == PermissionState.limited;
        });
        return;
      }
      final recent = paths.first;
      final count = await recent.assetCountAsync;
      final pageSize = count < 400 ? count : 400;
      final list = pageSize == 0
          ? <AssetEntity>[]
          : await recent.getAssetListPaged(page: 0, size: pageSize);
      setState(() {
        permission = state;
        assets = list;
        loading = false;
        limited = state == PermissionState.limited;
      });
    } catch (e) {
      setState(() {
        error = 'Impossible de lire la photothèque.';
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Rememba'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => SettingsScreen(session: widget.session)),
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        color: remembaGold,
        onRefresh: _load,
        child: _body(),
      ),
    );
  }

  Widget _body() {
    if (loading) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: const [
          SizedBox(height: 180),
          Center(child: CircularProgressIndicator(color: remembaGold)),
        ],
      );
    }
    if (error != null) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        children: [
          Text(error!, style: const TextStyle(color: remembaDanger)),
          const SizedBox(height: 16),
          GoldButton(label: 'Réessayer', onPressed: _load),
        ],
      );
    }
    if (permission != null && !permission!.hasAccess) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        children: [
          Text('Galerie', style: serifStyle(size: 36)),
          const SizedBox(height: 8),
          const Text(
            'Pour commencer, Rememba affiche les photos déjà sur cet appareil. Aucun compte n’est demandé.',
            style: TextStyle(color: remembaMuted),
          ),
          const SizedBox(height: 20),
          const Text(
            'Autorisez l’accès aux photos pour voir votre galerie.',
            style: TextStyle(color: remembaPaper),
          ),
          const SizedBox(height: 16),
          GoldButton(
            label: 'Autoriser l’accès',
            onPressed: () async {
              await PhotoManager.openSetting();
              await _load();
            },
          ),
        ],
      );
    }
    if (assets.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        children: [
          Text('Galerie', style: serifStyle(size: 36)),
          const SizedBox(height: 12),
          const Text('Aucune photo sur cet appareil pour le moment.', style: TextStyle(color: remembaMuted)),
        ],
      );
    }
    return CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
          sliver: SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Galerie', style: serifStyle(size: 36)),
                const SizedBox(height: 6),
                Text(
                  '${assets.length} photo${assets.length > 1 ? 's' : ''} sur cet appareil'
                  '${limited ? ' · accès limité' : ''}',
                  style: const TextStyle(color: remembaMuted),
                ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(8, 8, 8, 24),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 4,
              crossAxisSpacing: 4,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final asset = assets[index];
                return GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => LocalPhotoView(assets: assets, index: index)),
                    );
                  },
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: _Thumb(asset: asset),
                  ),
                );
              },
              childCount: assets.length,
            ),
          ),
        ),
      ],
    );
  }
}

class _Thumb extends StatelessWidget {
  const _Thumb({required this.asset});
  final AssetEntity asset;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Uint8List?>(
      future: asset.thumbnailDataWithSize(const ThumbnailSize.square(300)),
      builder: (context, snapshot) {
        final bytes = snapshot.data;
        if (bytes == null) {
          return const ColoredBox(color: remembaInkSoft);
        }
        return Image.memory(bytes, fit: BoxFit.cover, gaplessPlayback: true);
      },
    );
  }
}

class LocalPhotoView extends StatefulWidget {
  const LocalPhotoView({super.key, required this.assets, required this.index});
  final List<AssetEntity> assets;
  final int index;

  @override
  State<LocalPhotoView> createState() => _LocalPhotoViewState();
}

class _LocalPhotoViewState extends State<LocalPhotoView> {
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
    final asset = widget.assets[current];
    final taken = asset.createDateTime;
    return Scaffold(
      appBar: AppBar(
        title: Text('${current + 1} / ${widget.assets.length}'),
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
                    return const Center(child: CircularProgressIndicator(color: remembaGold));
                  }
                  return InteractiveViewer(
                    child: Center(child: Image.file(file, fit: BoxFit.contain)),
                  );
                },
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            child: Text(
              '${taken.day.toString().padLeft(2, '0')}/${taken.month.toString().padLeft(2, '0')}/${taken.year}',
              style: const TextStyle(color: remembaMuted),
            ),
          ),
        ],
      ),
    );
  }
}
