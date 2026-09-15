import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:rememba/ai/vision_backend.dart';
import 'package:rememba/api/rememba_api.dart';

class SessionController extends ChangeNotifier {
  SessionController() {
    api = RemembaApi(baseUrl: RemembaApi.defaultBaseUrl());
  }

  final _secure = const FlutterSecureStorage();
  late RemembaApi api;
  final VisionBackend vision = const CloudVisionBackend();

  bool ready = false;
  bool busy = false;
  String? error;
  Map<String, dynamic>? user;

  bool get isSignedIn => user != null && api.token != null;

  Future<void> bootstrap() async {
    final prefs = await SharedPreferences.getInstance();
    final savedUrl = prefs.getString('apiBaseUrl');
    if (savedUrl != null && savedUrl.isNotEmpty) {
      api.baseUrl = savedUrl;
    }
    api.token = await _secure.read(key: 'token');
    if (api.token != null) {
      try {
        user = await api.me();
      } catch (_) {
        api.token = null;
        user = null;
        await _secure.delete(key: 'token');
      }
    }
    ready = true;
    notifyListeners();
  }

  Future<void> setBaseUrl(String url) async {
    api.baseUrl = url.trim().replaceAll(RegExp(r'/$'), '');
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('apiBaseUrl', api.baseUrl);
    notifyListeners();
  }

  Future<void> signIn(String email, String password) async {
    busy = true;
    error = null;
    notifyListeners();
    try {
      final data = await api.login(email, password);
      await _acceptAuth(data);
    } on ApiException catch (e) {
      error = e.message;
    } catch (e) {
      error = 'Impossible de joindre le serveur (${api.baseUrl}).';
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<void> signUp({
    required String displayName,
    required String email,
    required String password,
    required bool aiPhotoAnalysis,
  }) async {
    busy = true;
    error = null;
    notifyListeners();
    try {
      final data = await api.register(
        displayName: displayName,
        email: email,
        password: password,
        aiPhotoAnalysis: aiPhotoAnalysis,
      );
      await _acceptAuth(data);
    } on ApiException catch (e) {
      error = e.message;
    } catch (e) {
      error = 'Impossible de joindre le serveur (${api.baseUrl}).';
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<void> _acceptAuth(Map<String, dynamic> data) async {
    final token = data['token'] as String?;
    if (token == null) throw ApiException('Jeton manquant');
    api.token = token;
    await _secure.write(key: 'token', value: token);
    user = {
      'id': data['id'],
      'email': data['email'],
      'displayName': data['displayName'],
    };
  }

  Future<void> signOut() async {
    api.token = null;
    user = null;
    await _secure.delete(key: 'token');
    notifyListeners();
  }

  Future<void> refreshMe() async {
    if (api.token == null) return;
    user = await api.me();
    notifyListeners();
  }
}
