import 'package:flutter/material.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:rememba/local/memory_library.dart';
import 'package:rememba/screens/agent_local_screen.dart';
import 'package:rememba/screens/analysis_overlay.dart';
import 'package:rememba/screens/events_local_screen.dart';
import 'package:rememba/screens/memory_home_screen.dart';
import 'package:rememba/screens/moments_screen.dart';
import 'package:rememba/screens/people_local_screen.dart';
import 'package:rememba/screens/settings_screen.dart';
import 'package:rememba/state/session.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/memory_mark.dart';

class MemoryShell extends StatefulWidget {
  const MemoryShell({super.key, required this.session});
  final SessionController session;

  @override
  State<MemoryShell> createState() => _MemoryShellState();
}

class _MemoryShellState extends State<MemoryShell> {
  final library = MemoryLibrary();
  int tab = 0;
  bool analyzing = false;
  bool analysisReady = false;

  @override
  void initState() {
    super.initState();
    library.addListener(_onLib);
    library.bootstrap().then((_) {
      if (!mounted) return;
      if (!library.analysisSeen && library.photoCount > 0) {
        setState(() => analyzing = true);
        Future<void>.delayed(const Duration(milliseconds: 1400), () {
          if (mounted) setState(() => analysisReady = true);
        });
      }
    });
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
      extendBody: true,
      appBar: AppBar(
        title: const Row(
          children: [
            MemoryMark(size: 28),
            SizedBox(width: 10),
            Text('Ma mémoire'),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => SettingsScreen(session: widget.session, library: library),
                ),
              );
            },
            icon: const Icon(Icons.tune_rounded),
          ),
        ],
      ),
      body: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: const BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment(0, -0.85),
                  radius: 1.15,
                  colors: [Color(0xFF1A1430), remembaInk],
                ),
              ),
            ),
          ),
          if (library.loading)
            const Center(child: CircularProgressIndicator(color: remembaAccent))
          else if (library.error != null)
            _Message(library.error!, onRetry: library.refresh)
          else if (library.permission != null && !library.permission!.hasAccess)
            _Message(
              'Rememba a besoin d’accéder à vos photos pour comprendre votre mémoire — elles restent sur l’appareil.',
              action: 'Autoriser',
              onRetry: () async {
                await PhotoManager.openSetting();
                await library.refresh();
              },
            )
          else
            IndexedStack(
              index: tab,
              children: [
                MemoryHomeScreen(library: library, onOpenPeople: () => setState(() => tab = 2)),
                MomentsScreen(library: library),
                const PeopleLocalScreen(),
                EventsLocalScreen(library: library),
              ],
            ),
          if (analyzing)
            AnalysisOverlay(
              photos: library.photoCount,
              events: library.events.length,
              links: library.suggestions.length,
              done: analysisReady,
              onContinue: () async {
                await library.markAnalysisSeen();
                if (mounted) setState(() => analyzing = false);
              },
            ),
        ],
      ),
      floatingActionButton: analyzing
          ? null
          : FloatingActionButton.extended(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => AgentLocalScreen(library: library)),
                );
              },
              icon: const Text('✦', style: TextStyle(fontSize: 18)),
              label: const Text('AI'),
            ),
      bottomNavigationBar: analyzing
          ? null
          : NavigationBar(
              selectedIndex: tab,
              onDestinationSelected: (i) => setState(() => tab = i),
              destinations: const [
                NavigationDestination(icon: Icon(Icons.auto_awesome_outlined), selectedIcon: Icon(Icons.auto_awesome), label: 'Mémoire'),
                NavigationDestination(icon: Icon(Icons.view_timeline_outlined), selectedIcon: Icon(Icons.view_timeline), label: 'Moments'),
                NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: 'Personnes'),
                NavigationDestination(icon: Icon(Icons.celebration_outlined), selectedIcon: Icon(Icons.celebration), label: 'Événements'),
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
