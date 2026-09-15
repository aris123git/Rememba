import 'package:flutter/material.dart';
import 'package:rememba/screens/local_gallery_screen.dart';
import 'package:rememba/state/session.dart';
import 'package:rememba/theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const RemembaApp());
}

class RemembaApp extends StatefulWidget {
  const RemembaApp({super.key});

  @override
  State<RemembaApp> createState() => _RemembaAppState();
}

class _RemembaAppState extends State<RemembaApp> {
  final session = SessionController();

  @override
  void initState() {
    super.initState();
    session.addListener(() => setState(() {}));
    session.bootstrap();
  }

  @override
  void dispose() {
    session.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rememba',
      debugShowCheckedModeBanner: false,
      theme: remembaTheme(),
      home: !session.ready
          ? const Scaffold(body: Center(child: CircularProgressIndicator(color: remembaGold)))
          : LocalGalleryHome(session: session),
    );
  }
}
