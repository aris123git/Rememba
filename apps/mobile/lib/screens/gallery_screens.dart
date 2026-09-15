import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:rememba/api/rememba_api.dart';
import 'package:rememba/state/session.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/common.dart';

class GalleryScreen extends StatefulWidget {
  const GalleryScreen({super.key, required this.session});
  final SessionController session;

  @override
  State<GalleryScreen> createState() => _GalleryScreenState();
}

class _GalleryScreenState extends State<GalleryScreen> {
  List<Map<String, dynamic>> photos = [];
  String? error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await widget.session.api.photos();
      setState(() => photos = (data['photos'] as List).cast<Map<String, dynamic>>());
    } on ApiException catch (e) {
      setState(() => error = e.message);
    }
  }

  Future<void> _import() async {
    final files = await ImagePicker().pickMultipleMedia(limit: 20);
    if (files.isEmpty) return;
    await widget.session.api.uploadFiles(files.map((f) => f.path).toList());
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    if (error != null) return Center(child: Text(error!));
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Row(
          children: [
            Text('Galerie', style: serifStyle(size: 32)),
            const Spacer(),
            GoldButton(label: 'Importer', onPressed: _import),
          ],
        ),
        const SizedBox(height: 8),
        Text('${photos.length} photo(s) · miniatures uniquement', style: const TextStyle(color: remembaMuted)),
        const SizedBox(height: 16),
        PhotoGrid(
          api: widget.session.api,
          ids: photos.map((p) => p['id'] as String).toList(),
          onTap: (id) => Navigator.push(context, MaterialPageRoute(builder: (_) => PhotoDetailScreen(session: widget.session, id: id))).then((_) => _load()),
        ),
      ],
    );
  }
}

class PhotoDetailScreen extends StatefulWidget {
  const PhotoDetailScreen({super.key, required this.session, required this.id});
  final SessionController session;
  final String id;

  @override
  State<PhotoDetailScreen> createState() => _PhotoDetailScreenState();
}

class _PhotoDetailScreenState extends State<PhotoDetailScreen> {
  Map<String, dynamic>? photo;

  @override
  void initState() {
    super.initState();
    widget.session.api.photo(widget.id).then((value) => setState(() => photo = value));
  }

  @override
  Widget build(BuildContext context) {
    final p = photo;
    return Scaffold(
      appBar: AppBar(title: Text(p?['originalFilename'] as String? ?? 'Photo')),
      body: p == null
          ? const Center(child: CircularProgressIndicator(color: remembaGold))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                AspectRatio(
                  aspectRatio: 1,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: AuthImage(api: widget.session.api, photoId: widget.id, variant: 'original', fit: BoxFit.contain),
                  ),
                ),
                const SizedBox(height: 12),
                Text('Analyse : ${p['analysisStatus']}', style: const TextStyle(color: remembaGold)),
                Text('Importée le ${p['importedAt']}', style: const TextStyle(color: remembaMuted)),
                const SizedBox(height: 12),
                Text('Visages', style: serifStyle(size: 22)),
                if ((p['faces'] as List?)?.isEmpty ?? true)
                  const Text('Aucun visage confirmé / encore en analyse.', style: TextStyle(color: remembaMuted))
                else
                  ...(p['faces'] as List).map((face) {
                    final cluster = face['cluster'];
                    final person = cluster is Map ? cluster['person'] : null;
                    final label = person is Map ? person['displayName'] : 'Personne non confirmée';
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text('$label'),
                      subtitle: const Text('suggestion jusqu’à confirmation', style: TextStyle(color: remembaMuted)),
                    );
                  }),
                const SizedBox(height: 16),
                OutlinedButton(
                  onPressed: () async {
                    final ok = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Supprimer cette photo ?'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Non')),
                          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Supprimer')),
                        ],
                      ),
                    );
                    if (ok == true) {
                      await widget.session.api.deletePhoto(widget.id);
                      if (context.mounted) Navigator.pop(context);
                    }
                  },
                  child: const Text('Supprimer la photo', style: TextStyle(color: remembaDanger)),
                ),
              ],
            ),
    );
  }
}
