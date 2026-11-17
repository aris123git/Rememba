import 'package:flutter/material.dart';
import 'package:rememba/screens/gallery_screens.dart';
import 'package:rememba/state/session.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/common.dart';

class PeopleScreen extends StatefulWidget {
  const PeopleScreen({super.key, required this.session});
  final SessionController session;

  @override
  State<PeopleScreen> createState() => _PeopleScreenState();
}

class _PeopleScreenState extends State<PeopleScreen> {
  Map<String, dynamic>? data;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    data = await widget.session.api.people();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    if (data == null) return const Center(child: CircularProgressIndicator(color: remembaGold));
    final unknown = (data!['unknown'] as List).cast<Map<String, dynamic>>();
    final people = (data!['people'] as List).cast<Map<String, dynamic>>();
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('Personnes', style: serifStyle(size: 32)),
        const Text('Une identité n’est certaine que lorsque vous la nommez.', style: TextStyle(color: remembaMuted)),
        const SizedBox(height: 20),
        Text('À confirmer', style: serifStyle(size: 22)),
        if (unknown.isEmpty) const Text('Aucun visage en attente.', style: TextStyle(color: remembaMuted)),
        ...unknown.map((item) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: item['coverPhotoId'] != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: SizedBox(width: 56, height: 56, child: AuthImage(api: widget.session.api, photoId: item['coverPhotoId'] as String)),
                    )
                  : null,
              title: const Text('Personne non nommée'),
              subtitle: Text('Apparaît sur ${item['photoCount']} photo(s)'),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => UnknownPersonScreen(session: widget.session, clusterId: item['clusterId'] as String))).then((_) => _load()),
            )),
        const SizedBox(height: 16),
        Text('Identités confirmées', style: serifStyle(size: 22)),
        if (people.isEmpty) const Text('Personne n’a encore été confirmé.', style: TextStyle(color: remembaMuted)),
        ...people.map((person) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: person['coverPhotoId'] != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: SizedBox(width: 56, height: 56, child: AuthImage(api: widget.session.api, photoId: person['coverPhotoId'] as String)),
                    )
                  : null,
              title: Text(person['displayName'] as String),
              subtitle: Text('${person['photoCount']} photo(s)'),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PersonScreen(session: widget.session, id: person['id'] as String))),
            )),
      ],
    );
  }
}

class PersonScreen extends StatelessWidget {
  const PersonScreen({super.key, required this.session, required this.id});
  final SessionController session;
  final String id;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: session.api.person(id),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Scaffold(body: Center(child: CircularProgressIndicator(color: remembaGold)));
        }
        final data = snapshot.data!;
        final photos = (data['photos'] as List).cast<Map<String, dynamic>>();
        return Scaffold(
          appBar: AppBar(title: Text(data['displayName'] as String)),
          body: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text('Identité confirmée', style: serifStyle(size: 16, color: remembaGold)),
              Text(data['displayName'] as String, style: serifStyle(size: 32)),
              const SizedBox(height: 16),
              PhotoGrid(
                api: session.api,
                ids: photos.map((p) => p['id'] as String).toList(),
                onTap: (photoId) => Navigator.push(context, MaterialPageRoute(builder: (_) => PhotoDetailScreen(session: session, id: photoId))),
              ),
            ],
          ),
        );
      },
    );
  }
}

class UnknownPersonScreen extends StatefulWidget {
  const UnknownPersonScreen({super.key, required this.session, required this.clusterId});
  final SessionController session;
  final String clusterId;

  @override
  State<UnknownPersonScreen> createState() => _UnknownPersonScreenState();
}

class _UnknownPersonScreenState extends State<UnknownPersonScreen> {
  Map<String, dynamic>? data;
  final name = TextEditingController();
  bool isSelf = false;
  String? error;

  @override
  void initState() {
    super.initState();
    widget.session.api.cluster(widget.clusterId).then((value) => setState(() => data = value));
  }

  @override
  void dispose() {
    name.dispose();
    super.dispose();
  }

  Future<void> _act(String action) async {
    try {
      await widget.session.api.peopleAction({
        'clusterId': widget.clusterId,
        'action': action,
        if (action == 'confirm') 'displayName': name.text.trim(),
        if (action == 'confirm') 'isUserSelf': isSelf,
      });
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() => error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final photos = ((data?['photos'] as List?) ?? []).cast<Map<String, dynamic>>();
    return Scaffold(
      appBar: AppBar(title: const Text('Personne non confirmée')),
      body: data == null
          ? const Center(child: CircularProgressIndicator(color: remembaGold))
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Text('Suggestion', style: serifStyle(size: 14, color: remembaGold)),
                Text('Nous avons trouvé une personne sur ${photos.length} photo(s).', style: serifStyle(size: 26)),
                const SizedBox(height: 12),
                PhotoGrid(
                  api: widget.session.api,
                  ids: photos.map((p) => p['id'] as String).toList(),
                  onTap: (id) => Navigator.push(context, MaterialPageRoute(builder: (_) => PhotoDetailScreen(session: widget.session, id: id))),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: name,
                  decoration: const InputDecoration(labelText: 'Nom'),
                  onChanged: (_) => setState(() {}),
                ),
                CheckboxListTile(
                  value: isSelf,
                  onChanged: (v) => setState(() => isSelf = v ?? false),
                  title: const Text('C’est moi'),
                  activeColor: remembaGold,
                ),
                if (error != null) Text(error!, style: const TextStyle(color: remembaDanger)),
                GoldButton(label: 'Associer ce nom', enabled: name.text.trim().isNotEmpty, onPressed: () => _act('confirm')),
                TextButton(onPressed: () => _act('split'), child: const Text('Ce sont plusieurs personnes')),
                TextButton(onPressed: () => _act('ignore'), child: const Text('Ignorer', style: TextStyle(color: remembaMuted))),
              ],
            ),
    );
  }
}
