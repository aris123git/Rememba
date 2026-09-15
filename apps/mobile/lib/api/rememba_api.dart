import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

class ApiException implements Exception {
  ApiException(this.message, [this.statusCode]);
  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class RemembaApi {
  RemembaApi({required this.baseUrl, this.token});

  String baseUrl;
  String? token;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Uri _u(String path, [Map<String, String>? query]) {
    final root = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    return Uri.parse('$root$path').replace(queryParameters: query);
  }

  Future<dynamic> _send(http.BaseRequest request) async {
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    final streamed = await request.send().timeout(const Duration(seconds: 60));
    final response = await http.Response.fromStream(streamed);
    return _decode(response);
  }

  dynamic _decode(http.Response response) {
    if (response.statusCode >= 400) {
      String message = 'Erreur ${response.statusCode}';
      try {
        final body = jsonDecode(response.body);
        if (body is Map && body['error'] is String) message = body['error'] as String;
      } catch (_) {}
      throw ApiException(message, response.statusCode);
    }
    if (response.body.isEmpty) return null;
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> register({
    required String displayName,
    required String email,
    required String password,
    required bool aiPhotoAnalysis,
  }) async {
    final response = await http
        .post(
          _u('/api/auth/register'),
          headers: _headers,
          body: jsonEncode({
            'displayName': displayName,
            'email': email,
            'password': password,
            'aiPhotoAnalysis': aiPhotoAnalysis,
          }),
        )
        .timeout(const Duration(seconds: 30));
    return _decode(response) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http
        .post(
          _u('/api/auth/login'),
          headers: _headers,
          body: jsonEncode({'email': email, 'password': password}),
        )
        .timeout(const Duration(seconds: 30));
    return _decode(response) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> me() async {
    final response = await http.get(_u('/api/auth/me'), headers: _headers);
    return _decode(response) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> photos() async {
    final response = await http.get(_u('/api/photos', {'limit': '80'}), headers: _headers);
    return _decode(response) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> photo(String id) async {
    final response = await http.get(_u('/api/photos/$id'), headers: _headers);
    return _decode(response) as Map<String, dynamic>;
  }

  Future<void> deletePhoto(String id) async {
    final response = await http.delete(_u('/api/photos/$id'), headers: _headers);
    _decode(response);
  }

  Future<Map<String, dynamic>> uploadFiles(List<String> paths) async {
    final request = http.MultipartRequest('POST', _u('/api/photos'));
    for (final path in paths) {
      final lower = path.toLowerCase();
      var subtype = 'jpeg';
      if (lower.endsWith('.png')) subtype = 'png';
      if (lower.endsWith('.webp')) subtype = 'webp';
      request.files.add(await http.MultipartFile.fromPath(
        'files',
        path,
        contentType: MediaType('image', subtype),
      ));
    }
    return await _send(request) as Map<String, dynamic>;
  }

  Future<Uint8List> photoBytes(String id, {String variant = 'thumb'}) async {
    final response = await http.get(
      _u('/api/photos/$id/file', {'variant': variant}),
      headers: {if (token != null) 'Authorization': 'Bearer $token'},
    );
    if (response.statusCode >= 400) {
      throw ApiException('Image indisponible', response.statusCode);
    }
    return response.bodyBytes;
  }

  Future<Map<String, dynamic>> people() async {
    final response = await http.get(_u('/api/people'), headers: _headers);
    return _decode(response) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> person(String id) async {
    final response = await http.get(_u('/api/people/$id'), headers: _headers);
    return _decode(response) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> cluster(String id) async {
    final response = await http.get(_u('/api/people/clusters/$id'), headers: _headers);
    return _decode(response) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> peopleAction(Map<String, dynamic> body) async {
    final response = await http.post(_u('/api/people'), headers: _headers, body: jsonEncode(body));
    return _decode(response) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> events() async {
    final response = await http.get(_u('/api/events'), headers: _headers);
    return _decode(response) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> event(String id) async {
    final response = await http.get(_u('/api/events/$id'), headers: _headers);
    return _decode(response) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createEvent(Map<String, dynamic> body) async {
    final response = await http.post(_u('/api/events'), headers: _headers, body: jsonEncode(body));
    return _decode(response) as Map<String, dynamic>;
  }

  Future<void> patchEvent(String id, Map<String, dynamic> body) async {
    final response = await http.patch(_u('/api/events/$id'), headers: _headers, body: jsonEncode(body));
    _decode(response);
  }

  Future<void> deleteEvent(String id) async {
    final response = await http.delete(_u('/api/events/$id'), headers: _headers);
    _decode(response);
  }

  Future<Map<String, dynamic>> suggestions() async {
    final response = await http.get(_u('/api/suggestions'), headers: _headers);
    return _decode(response) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> suggestionAction(Map<String, dynamic> body) async {
    final response = await http.post(_u('/api/suggestions'), headers: _headers, body: jsonEncode(body));
    return _decode(response) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> jobs() async {
    final response = await http.get(_u('/api/jobs'), headers: _headers);
    return _decode(response) as Map<String, dynamic>;
  }

  Future<void> setConsent(bool granted) async {
    final response = await http.put(
      _u('/api/consents'),
      headers: _headers,
      body: jsonEncode({'type': 'AI_PHOTO_ANALYSIS', 'granted': granted}),
    );
    _decode(response);
  }

  Future<void> deleteAccount() async {
    final response = await http.delete(
      _u('/api/account'),
      headers: _headers,
      body: jsonEncode({'confirmation': 'SUPPRIMER'}),
    );
    _decode(response);
  }

  static String defaultBaseUrl() {
    if (Platform.isAndroid) return 'http://10.0.2.2:3000';
    return 'http://127.0.0.1:3000';
  }
}
