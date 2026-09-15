import 'package:flutter/foundation.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:rememba/local/memory_model.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MemoryLibrary extends ChangeNotifier {
  PermissionState? permission;
  bool loading = true;
  bool limited = false;
  bool analysisSeen = false;
  String? error;
  String displayName = '';
  List<AssetEntity> assets = [];
  final Map<String, AssetEntity> byId = {};
  List<MemoryEvent> events = [];
  Set<String> dismissed = {};
  Set<String> accepted = {};

  int get photoCount => assets.length;

  List<MemorySuggestion> get suggestions {
    final liveEvents = events.where((e) => !dismissed.contains(e.id)).toList();
    return suggestionsFor(liveEvents).where((s) {
      if (dismissed.contains(s.id)) return false;
      if (s.eventId.isNotEmpty && dismissed.contains(s.eventId)) return false;
      return true;
    }).toList();
  }

  MemoryEvent? get hero {
    final live = events.where((e) => !dismissed.contains(e.id)).toList();
    return heroEvent(live);
  }

  AssetEntity? assetFor(String id) => byId[id];

  List<AssetEntity> assetsFor(MemoryEvent event) {
    return event.photoIds.map(assetFor).whereType<AssetEntity>().toList();
  }

  Future<void> bootstrap() async {
    final prefs = await SharedPreferences.getInstance();
    displayName = prefs.getString('localDisplayName') ?? '';
    analysisSeen = prefs.getBool('analysisPlayed') ?? false;
    dismissed = {...(prefs.getStringList('dismissedMemory') ?? const [])};
    accepted = {...(prefs.getStringList('acceptedMemory') ?? const [])};
    await refresh();
  }

  Future<void> setDisplayName(String name) async {
    displayName = name.trim();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('localDisplayName', displayName);
    notifyListeners();
  }

  Future<void> markAnalysisSeen() async {
    analysisSeen = true;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('analysisPlayed', true);
    notifyListeners();
  }

  Future<void> dismiss(String id) async {
    dismissed.add(id);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('dismissedMemory', dismissed.toList());
    notifyListeners();
  }

  Future<void> accept(String eventId) async {
    accepted.add(eventId);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('acceptedMemory', accepted.toList());
    notifyListeners();
  }

  Future<void> rename(MemoryEvent event, String title) async {
    final index = events.indexWhere((e) => e.id == event.id);
    if (index < 0) return;
    events[index] = event.copyWith(title: title.trim().isEmpty ? event.title : title.trim());
    notifyListeners();
  }

  Future<void> refresh() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final state = await PhotoManager.requestPermissionExtend();
      permission = state;
      limited = state == PermissionState.limited;
      if (!state.hasAccess) {
        assets = [];
        byId.clear();
        events = [];
        loading = false;
        notifyListeners();
        return;
      }
      final paths = await PhotoManager.getAssetPathList(type: RequestType.image, onlyAll: true);
      if (paths.isEmpty) {
        assets = [];
        byId.clear();
        events = [];
        loading = false;
        notifyListeners();
        return;
      }
      final recent = paths.first;
      final count = await recent.assetCountAsync;
      final pageSize = count < 600 ? count : 600;
      final list = pageSize == 0 ? <AssetEntity>[] : await recent.getAssetListPaged(page: 0, size: pageSize);
      assets = list;
      byId
        ..clear()
        ..addEntries(list.map((a) => MapEntry(a.id, a)));
      final stamps = list.map(_stamp).toList();
      final home = homeLocation(stamps);
      events = groupEvents(stamps, homeLat: home.lat, homeLng: home.lng);
      loading = false;
      notifyListeners();
    } catch (e) {
      error = 'Impossible de lire la photothèque.';
      loading = false;
      notifyListeners();
    }
  }

  PhotoStamp _stamp(AssetEntity asset) {
    return PhotoStamp(
      id: asset.id,
      at: asset.createDateTime,
      lat: _coord(asset.latitude),
      lng: _coord(asset.longitude),
    );
  }

  double? _coord(double? value) {
    if (value == null || value == 0) return null;
    return value;
  }
}
