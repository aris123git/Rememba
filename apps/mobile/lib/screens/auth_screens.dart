import 'package:flutter/material.dart';
import 'package:rememba/state/session.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/common.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.session, required this.onRegister});
  final SessionController session;
  final VoidCallback onRegister;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final email = TextEditingController();
  final password = TextEditingController();
  final server = TextEditingController();

  @override
  void initState() {
    super.initState();
    server.text = widget.session.api.baseUrl;
  }

  @override
  void dispose() {
    email.dispose();
    password.dispose();
    server.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = widget.session;
    return Scaffold(
      appBar: AppBar(title: const Text('Compte optionnel')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text('Rememba', style: serifStyle(size: 36)),
            const SizedBox(height: 8),
            const Text('Optionnel. La galerie marche déjà sans compte.', style: TextStyle(color: remembaMuted)),
            const SizedBox(height: 32),
            Text('Connexion', style: serifStyle(size: 28)),
            const SizedBox(height: 16),
            TextField(controller: email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'E-mail')),
            const SizedBox(height: 12),
            TextField(controller: password, obscureText: true, decoration: const InputDecoration(labelText: 'Mot de passe')),
            const SizedBox(height: 12),
            TextField(
              controller: server,
              decoration: const InputDecoration(
                labelText: 'URL du serveur',
                helperText: 'Émulateur Android : http://10.0.2.2:3000  ·  téléphone : IP du PC',
              ),
            ),
            if (session.error != null) ...[
              const SizedBox(height: 12),
              Text(session.error!, style: const TextStyle(color: remembaDanger)),
            ],
            const SizedBox(height: 20),
            GoldButton(
              label: session.busy ? 'Connexion…' : 'Entrer',
              enabled: !session.busy,
              onPressed: () async {
                await session.setBaseUrl(server.text);
                await session.signIn(email.text.trim(), password.text);
                if (session.isSignedIn && context.mounted) Navigator.pop(context);
              },
            ),
            TextButton(
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => RegisterScreen(session: session, onLogin: () => Navigator.pop(context))));
              },
              child: const Text('Créer un compte', style: TextStyle(color: remembaGold)),
            ),
          ],
        ),
      ),
    );
  }
}

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key, required this.session, required this.onLogin});
  final SessionController session;
  final VoidCallback onLogin;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final name = TextEditingController();
  final email = TextEditingController();
  final password = TextEditingController();
  final server = TextEditingController();
  bool consent = true;

  @override
  void initState() {
    super.initState();
    server.text = widget.session.api.baseUrl;
  }

  @override
  void dispose() {
    name.dispose();
    email.dispose();
    password.dispose();
    server.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = widget.session;
    return Scaffold(
      appBar: AppBar(title: const Text('Compte optionnel')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text('Créer un compte', style: serifStyle(size: 32)),
            const SizedBox(height: 16),
            TextField(controller: name, decoration: const InputDecoration(labelText: 'Prénom')),
            const SizedBox(height: 12),
            TextField(controller: email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'E-mail')),
            const SizedBox(height: 12),
            TextField(controller: password, obscureText: true, decoration: const InputDecoration(labelText: 'Mot de passe (8 min.)')),
            const SizedBox(height: 12),
            TextField(controller: server, decoration: const InputDecoration(labelText: 'URL du serveur')),
            CheckboxListTile(
              value: consent,
              onChanged: (v) => setState(() => consent = v ?? false),
              activeColor: remembaGold,
              title: const Text(
                'J’autorise l’analyse des visages. Toute identification reste une suggestion jusqu’à confirmation.',
                style: TextStyle(fontSize: 13),
              ),
            ),
            if (session.error != null) Text(session.error!, style: const TextStyle(color: remembaDanger)),
            GoldButton(
              label: session.busy ? 'Création…' : 'Créer mon espace',
              enabled: !session.busy,
              onPressed: () async {
                await session.setBaseUrl(server.text);
                await session.signUp(
                  displayName: name.text.trim(),
                  email: email.text.trim(),
                  password: password.text,
                  aiPhotoAnalysis: consent,
                );
                if (session.isSignedIn && context.mounted) {
                  Navigator.pop(context);
                  Navigator.pop(context);
                }
              },
            ),
            TextButton(onPressed: widget.onLogin, child: const Text('J’ai déjà un compte', style: TextStyle(color: remembaGold))),
          ],
        ),
      ),
    );
  }
}
