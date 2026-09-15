import 'package:flutter/material.dart';
import 'package:rememba/local/memory_library.dart';
import 'package:rememba/screens/auth_screens.dart';
import 'package:rememba/screens/shell.dart';
import 'package:rememba/state/session.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/common.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key, required this.session, this.library});
  final SessionController session;
  final MemoryLibrary? library;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool granted = false;
  final confirm = TextEditingController();
  final server = TextEditingController();
  final firstName = TextEditingController();

  @override
  void initState() {
    super.initState();
    server.text = widget.session.api.baseUrl;
    firstName.text = widget.library?.displayName ?? '';
    granted = widget.session.user?['aiPhotoAnalysis'] == true;
    if (widget.session.isSignedIn) {
      widget.session.refreshMe().then((_) {
        if (mounted) setState(() => granted = widget.session.user?['aiPhotoAnalysis'] == true);
      });
    }
  }

  @override
  void dispose() {
    confirm.dispose();
    server.dispose();
    firstName.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final signedIn = widget.session.isSignedIn;
    final user = widget.session.user;
    return Scaffold(
      appBar: AppBar(title: const Text('Réglages')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Pour commencer', style: serifStyle(size: 28)),
          const SizedBox(height: 8),
          const Text(
            'Rememba comprend votre mémoire sur l’appareil. Aucun compte n’est nécessaire pour commencer.',
            style: TextStyle(color: remembaMuted),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: firstName,
            decoration: const InputDecoration(labelText: 'Prénom (optionnel, pour l’accueil)'),
            onSubmitted: (v) => widget.library?.setDisplayName(v),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(
              onPressed: () => widget.library?.setDisplayName(firstName.text),
              child: const Text('Enregistrer le prénom'),
            ),
          ),
          const SizedBox(height: 24),
          Text('Compte (plus tard)', style: serifStyle(size: 22)),
          const Text(
            'Souvenirs IA, personnes, événements et sync arriveront ensuite, si vous le souhaitez.',
            style: TextStyle(color: remembaMuted),
          ),
          const SizedBox(height: 12),
          if (!signedIn)
            GoldButton(
              label: 'Connecter un compte (optionnel)',
              onPressed: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => LoginScreen(
                      session: widget.session,
                      onRegister: () {},
                    ),
                  ),
                );
                if (mounted) setState(() {});
              },
            )
          else ...[
            Text('${user?['displayName'] ?? ''} · ${user?['email'] ?? ''}', style: const TextStyle(color: remembaMuted)),
            const SizedBox(height: 8),
            GoldButton(
              label: 'Ouvrir l’espace compte',
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => ShellScreen(session: widget.session)));
              },
            ),
            const SizedBox(height: 12),
            TextField(
              controller: server,
              decoration: const InputDecoration(labelText: 'URL du backend'),
              onSubmitted: (v) => widget.session.setBaseUrl(v),
            ),
            SwitchListTile(
              value: granted,
              activeThumbColor: remembaGold,
              title: const Text('Autoriser l’analyse IA des photos'),
              onChanged: (v) async {
                await widget.session.api.setConsent(v);
                setState(() => granted = v);
              },
            ),
            SwitchListTile(
              value: widget.session.user?['collectiveMatching'] == true,
              activeThumbColor: remembaGold,
              title: const Text('Matching collectif (opt-in)'),
              onChanged: (v) async {
                await widget.session.api.setConsent(v, type: 'COLLECTIVE_MATCHING');
                await widget.session.refreshMe();
                setState(() {});
              },
            ),
            const Divider(),
            Text('Supprimer mon compte', style: serifStyle(size: 22)),
            TextField(
              controller: confirm,
              decoration: const InputDecoration(labelText: 'Tapez SUPPRIMER'),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: confirm.text == 'SUPPRIMER'
                  ? () async {
                      await widget.session.api.deleteAccount();
                      await widget.session.signOut();
                      if (context.mounted) Navigator.pop(context);
                    }
                  : null,
              child: const Text('Tout supprimer', style: TextStyle(color: remembaDanger)),
            ),
            const SizedBox(height: 16),
            GoldButton(
              label: 'Déconnexion',
              onPressed: () async {
                await widget.session.signOut();
                if (context.mounted) setState(() {});
              },
            ),
          ],
        ],
      ),
    );
  }
}
