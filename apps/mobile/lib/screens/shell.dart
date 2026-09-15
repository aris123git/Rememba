import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:rememba/api/rememba_api.dart';
import 'package:rememba/screens/event_screens.dart';
import 'package:rememba/screens/gallery_screens.dart';
import 'package:rememba/screens/people_screens.dart';
import 'package:rememba/screens/settings_screen.dart';
import 'package:rememba/screens/suggestions_screen.dart';
import 'package:rememba/state/session.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/common.dart';

class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key, required this.session});
  final SessionController session;

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  int index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(session: widget.session, onOpenSuggestions: () => setState(() => index = 4)),
      GalleryScreen(session: widget.session),
      PeopleScreen(session: widget.session),
      EventsScreen(session: widget.session),
      SuggestionsScreen(session: widget.session),
    ];
    return Scaffold(
      appBar: AppBar(
        title: const Text('Rememba'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => SettingsScreen(session: widget.session)));
            },
          ),
        ],
      ),
      body: pages[index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) => setState(() => index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.auto_awesome_outlined), label: 'Souvenirs'),
          NavigationDestination(icon: Icon(Icons.photo_outlined), label: 'Galerie'),
          NavigationDestination(icon: Icon(Icons.people_outline), label: 'Personnes'),
          NavigationDestination(icon: Icon(Icons.event_outlined), label: 'Événements'),
          NavigationDestination(icon: Icon(Icons.lightbulb_outline), label: 'IA'),
        ],
      ),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.session, required this.onOpenSuggestions});
  final SessionController session;
  final VoidCallback onOpenSuggestions;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? data;
  String? error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final api = widget.session.api;
      final photos = await api.photos();
      final events = await api.events();
      final people = await api.people();
      final suggestions = await api.suggestions();
      final jobs = await api.jobs();
      setState(() {
        data = {
          'photos': photos['photos'] ?? [],
          'events': events['events'] ?? [],
          'people': people['people'] ?? [],
          'unknown': people['unknown'] ?? [],
          'suggestions': suggestions['suggestions'] ?? [],
          'jobs': jobs,
        };
        error = null;
      });
    } on ApiException catch (e) {
      setState(() => error = e.message);
    }
  }

  Future<void> _import() async {
    final picker = ImagePicker();
    final files = await picker.pickMultipleMedia(limit: 20);
    if (files.isEmpty) return;
    try {
      await widget.session.api.uploadFiles(files.map((f) => f.path).toList());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Photos importées. Analyse en cours sur le serveur…')),
        );
        await _load();
      }
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.session.user?['displayName'] ?? '';
    if (error != null) return Center(child: Text(error!, style: const TextStyle(color: remembaDanger)));
    if (data == null) return const Center(child: CircularProgressIndicator(color: remembaGold));
    final photos = (data!['photos'] as List).cast<Map<String, dynamic>>();
    final events = (data!['events'] as List).cast<Map<String, dynamic>>();
    final suggestions = (data!['suggestions'] as List).cast<Map<String, dynamic>>();
    final pending = (data!['jobs'] as Map)['pendingPhotos'] ?? 0;

    return RefreshIndicator(
      color: remembaGold,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Vos souvenirs', style: serifStyle(size: 36)),
          Text('Bonjour $name. L’IA propose, vous décidez.', style: const TextStyle(color: remembaMuted)),
          const SizedBox(height: 16),
          Align(alignment: Alignment.centerLeft, child: GoldButton(label: 'Importer des photos', onPressed: _import)),
          if (pending is num && pending > 0)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text('Analyse en cours sur $pending photo(s) — côté serveur, pas dans l’APK.', style: const TextStyle(color: remembaGold)),
            ),
          const SizedBox(height: 28),
          Row(
            children: [
              Text('✨ Suggestions de l’IA', style: serifStyle(size: 22)),
              const Spacer(),
              TextButton(onPressed: widget.onOpenSuggestions, child: const Text('Tout voir', style: TextStyle(color: remembaGold))),
            ],
          ),
          if (suggestions.isEmpty)
            const Text('Aucune suggestion pour l’instant. Importez des photos — rien ne s’applique tout seul.', style: TextStyle(color: remembaMuted))
          else
            Text('${suggestions.length} proposition(s) en attente.', style: const TextStyle(color: remembaGold)),
          const SizedBox(height: 24),
          Text('Événements récents', style: serifStyle(size: 22)),
          const SizedBox(height: 8),
          if (events.isEmpty)
            const Text('Pas encore d’événement.', style: TextStyle(color: remembaMuted))
          else
            ...events.take(4).map((event) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: event['coverPhotoId'] != null
                      ? SizedBox(
                          width: 56,
                          height: 56,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: AuthImage(api: widget.session.api, photoId: event['coverPhotoId'] as String),
                          ),
                        )
                      : const Icon(Icons.event, color: remembaGold),
                  title: Text(event['name'] as String),
                  subtitle: Text('${event['photoCount']} photo(s)'),
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => EventDetailScreen(session: widget.session, id: event['id'] as String))),
                )),
          const SizedBox(height: 24),
          Text('Galerie récente', style: serifStyle(size: 22)),
          const SizedBox(height: 8),
          PhotoGrid(
            api: widget.session.api,
            ids: photos.take(9).map((p) => p['id'] as String).toList(),
            onTap: (id) => Navigator.push(context, MaterialPageRoute(builder: (_) => PhotoDetailScreen(session: widget.session, id: id))),
          ),
        ],
      ),
    );
  }
}
