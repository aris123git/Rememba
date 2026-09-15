import 'package:flutter/material.dart';
import 'package:rememba/state/session.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/common.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key, required this.session});
  final SessionController session;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool granted = false;
  final confirm = TextEditingController();
  final server = TextEditingController();

  @override
  void initState() {
    super.initState();
    server.text = widget.session.api.baseUrl;
    granted = widget.session.user?['aiPhotoAnalysis'] == true;
    widget.session.refreshMe().then((_) {
      setState(() => granted = widget.session.user?['aiPhotoAnalysis'] == true);
    });
  }

  @override
  void dispose() {
    confirm.dispose();
    server.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.session.user;
    return Scaffold(
      appBar: AppBar(title: const Text('Réglages')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Confidentialité', style: serifStyle(size: 28)),
          Text('${user?['displayName'] ?? ''} · ${user?['email'] ?? ''}', style: const TextStyle(color: remembaMuted)),
          const SizedBox(height: 8),
          Text(widget.session.vision.label, style: const TextStyle(color: remembaMuted, fontSize: 13)),
          const SizedBox(height: 16),
          TextField(
            controller: server,
            decoration: const InputDecoration(labelText: 'URL du backend'),
            onSubmitted: (v) => widget.session.setBaseUrl(v),
          ),
          SwitchListTile(
            value: granted,
            activeThumbColor: remembaGold,
            title: const Text('Autoriser l’analyse IA des photos'),
            subtitle: const Text('Sans accord, la galerie marche, sans visages.'),
            onChanged: (v) async {
              await widget.session.api.setConsent(v);
              setState(() => granted = v);
            },
          ),
          SwitchListTile(
            value: widget.session.user?['collectiveMatching'] == true,
            activeThumbColor: remembaGold,
            title: const Text('Matching collectif (opt-in)'),
            subtitle: const Text('Compare uniquement les visages « c’est moi » entre comptes consentants. Aucun partage auto.'),
            onChanged: (v) async {
              await widget.session.api.setConsent(v, type: 'COLLECTIVE_MATCHING');
              await widget.session.refreshMe();
              setState(() {});
            },
          ),
          SwitchListTile(
            value: widget.session.user?['publicDiscovery'] == true,
            activeThumbColor: remembaGold,
            title: const Text('Découverte d’événements publics'),
            subtitle: const Text('Voir les événements organisateur publics. Rejoindre ≠ voir les photos.'),
            onChanged: (v) async {
              await widget.session.api.setConsent(v, type: 'PUBLIC_DISCOVERY');
              await widget.session.refreshMe();
              setState(() {});
            },
          ),
          const Divider(),
          Text('Supprimer mon compte', style: serifStyle(size: 22)),
          const Text('Efface photos, visages, événements et fichiers. Irréversible.', style: TextStyle(color: remembaMuted)),
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
          const SizedBox(height: 24),
          GoldButton(label: 'Déconnexion', onPressed: () async {
            await widget.session.signOut();
            if (context.mounted) Navigator.pop(context);
          }),
          const SizedBox(height: 24),
          const Text('V1–V7 : souvenirs, lieux, partages, agent, vidéo, mémoire, événements publics. Le modèle IA reste sur le serveur.', style: TextStyle(color: remembaMuted, fontSize: 13)),
        ],
      ),
    );
  }
}
