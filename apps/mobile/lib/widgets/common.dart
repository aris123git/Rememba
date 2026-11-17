import 'package:flutter/material.dart';
import 'package:rememba/api/rememba_api.dart';
import 'package:rememba/theme.dart';

class AuthImage extends StatelessWidget {
  const AuthImage({
    super.key,
    required this.api,
    required this.photoId,
    this.variant = 'thumb',
    this.fit = BoxFit.cover,
  });

  final RemembaApi api;
  final String photoId;
  final String variant;
  final BoxFit fit;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: api.photoBytes(photoId, variant: variant),
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          return Image.memory(snapshot.data!, fit: fit, width: double.infinity, height: double.infinity);
        }
        if (snapshot.hasError) {
          return const ColoredBox(color: remembaInkSoft, child: Icon(Icons.broken_image, color: remembaMuted));
        }
        return const ColoredBox(
          color: remembaInkSoft,
          child: Center(child: CircularProgressIndicator(color: remembaGold, strokeWidth: 2)),
        );
      },
    );
  }
}

class PhotoGrid extends StatelessWidget {
  const PhotoGrid({super.key, required this.api, required this.ids, required this.onTap});

  final RemembaApi api;
  final List<String> ids;
  final void Function(String id) onTap;

  @override
  Widget build(BuildContext context) {
    if (ids.isEmpty) {
      return const Text('Aucune photo.', style: TextStyle(color: remembaMuted));
    }
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: ids.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
      ),
      itemBuilder: (context, index) {
        final id = ids[index];
        return GestureDetector(
          onTap: () => onTap(id),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: AuthImage(api: api, photoId: id),
          ),
        );
      },
    );
  }
}

class GoldButton extends StatelessWidget {
  const GoldButton({super.key, required this.label, required this.onPressed, this.enabled = true});

  final String label;
  final VoidCallback? onPressed;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: enabled ? onPressed : null,
      style: FilledButton.styleFrom(
        backgroundColor: remembaGold,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        shape: const StadiumBorder(),
      ),
      child: Text(label),
    );
  }
}
