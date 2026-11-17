import 'package:flutter/material.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:rememba/local/memory_library.dart';
import 'package:rememba/screens/agent_local_screen.dart';
import 'package:rememba/screens/collections_screen.dart';
import 'package:rememba/screens/photos_screen.dart';
import 'package:rememba/state/session.dart';
import 'package:rememba/theme.dart';

class MemoryShell extends StatefulWidget {
  const MemoryShell({super.key, required this.session});
  final SessionController session;

  @override
  State<MemoryShell> createState() => _MemoryShellState();
}

class _MemoryShellState extends State<MemoryShell> {
  final library = MemoryLibrary();
  int tab = 0;

  @override
  void initState() {
    super.initState();
    library.addListener(_onLib);
    library.bootstrap();
  }

  void _onLib() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    library.removeListener(_onLib);
    library.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: library.loading
            ? const Center(child: CircularProgressIndicator())
            : library.error != null
                ? _Message(library.error!, onRetry: library.refresh)
                : library.permission != null && !library.permission!.hasAccess
                    ? _Message(
                        'Autorisez l’accès aux photos pour afficher votre galerie. Elles restent sur l’appareil.',
                        action: 'Autoriser',
                        onRetry: () async {
                          await PhotoManager.openSetting();
                          await library.refresh();
                        },
                      )
                    : IndexedStack(
                        index: tab,
                        children: [
                          PhotosScreen(library: library, onSearch: () => setState(() => tab = 1)),
                          AgentLocalScreen(library: library),
                          CollectionsScreen(library: library, session: widget.session),
                        ],
                      ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: (i) => setState(() => tab = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.photo_outlined), selectedIcon: Icon(Icons.photo), label: 'Photos'),
          NavigationDestination(icon: Icon(Icons.search), selectedIcon: Icon(Icons.search), label: 'Recherche'),
          NavigationDestination(icon: Icon(Icons.grid_view_outlined), selectedIcon: Icon(Icons.grid_view), label: 'Collections'),
        ],
      ),
    );
  }
}

class _Message extends StatelessWidget {
  const _Message(this.text, {this.onRetry, this.action = 'Réessayer'});
  final String text;
  final VoidCallback? onRetry;
  final String action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(text, textAlign: TextAlign.center, style: const TextStyle(color: remembaMuted, height: 1.45)),
          if (onRetry != null) ...[
            const SizedBox(height: 20),
            FilledButton(onPressed: onRetry, child: Text(action)),
          ],
        ],
      ),
    );
  }
}
