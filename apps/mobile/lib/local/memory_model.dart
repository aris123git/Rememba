import 'package:rememba/local/format.dart';

class PhotoStamp {
  const PhotoStamp({
    required this.id,
    required this.at,
    this.lat,
    this.lng,
  });

  final String id;
  final DateTime at;
  final double? lat;
  final double? lng;
}

class MemoryEvent {
  const MemoryEvent({
    required this.id,
    required this.photoIds,
    required this.startsAt,
    required this.endsAt,
    required this.kind,
    required this.title,
    this.lat,
    this.lng,
    this.dismissed = false,
  });

  final String id;
  final List<String> photoIds;
  final DateTime startsAt;
  final DateTime endsAt;
  final String kind;
  final String title;
  final double? lat;
  final double? lng;
  final bool dismissed;

  int get photoCount => photoIds.length;

  MemoryEvent copyWith({bool? dismissed, String? title}) {
    return MemoryEvent(
      id: id,
      photoIds: photoIds,
      startsAt: startsAt,
      endsAt: endsAt,
      kind: kind,
      title: title ?? this.title,
      lat: lat,
      lng: lng,
      dismissed: dismissed ?? this.dismissed,
    );
  }
}

class MemorySuggestion {
  const MemorySuggestion({
    required this.id,
    required this.kind,
    required this.title,
    required this.body,
    required this.eventId,
  });

  final String id;
  final String kind;
  final String title;
  final String body;
  final String eventId;
}

const eventGapMs = 4 * 60 * 60 * 1000;
const eventMinPhotos = 3;
const travelKm = 40.0;

String inferKind(List<PhotoStamp> photos, {double? homeLat, double? homeLng}) {
  final withGps = photos.where((p) => p.lat != null && p.lng != null).toList();
  if (withGps.isNotEmpty && homeLat != null && homeLng != null) {
    final far = withGps.where((p) => haversineFromHome(p, homeLat, homeLng) >= travelKm).length;
    if (far >= (photos.length / 2).ceil()) return 'VOYAGE';
  }
  final hour = photos.first.at.hour;
  if (photos.length >= 12 && hour >= 18) return 'FETE';
  if (photos.length >= 8 && hour >= 10 && hour <= 16) return 'JOURNEE';
  return 'SOUVENIR';
}

String kindLabel(String kind) {
  switch (kind) {
    case 'VOYAGE':
      return 'Voyage';
    case 'FETE':
      return 'Célébration';
    case 'JOURNEE':
      return 'Journée';
    case 'MARIAGE':
      return 'Mariage';
    case 'CONCERT':
      return 'Concert';
    case 'CEREMONIE':
      return 'Cérémonie';
    default:
      return 'Souvenir';
  }
}

String kindEmoji(String kind) {
  switch (kind) {
    case 'VOYAGE':
      return '✈️';
    case 'FETE':
      return '🎉';
    case 'JOURNEE':
      return '☀️';
    case 'MARIAGE':
      return '💍';
    case 'CONCERT':
      return '🎤';
    case 'CEREMONIE':
      return '🎓';
    default:
      return '✨';
  }
}

double haversineFromHome(PhotoStamp photo, double homeLat, double homeLng) {
  return haversineKm(photo.lat!, photo.lng!, homeLat, homeLng);
}

List<MemoryEvent> groupEvents(List<PhotoStamp> photos, {double? homeLat, double? homeLng}) {
  final sorted = [...photos]..sort((a, b) => a.at.compareTo(b.at));
  final buckets = <List<PhotoStamp>>[];
  var current = <PhotoStamp>[];
  for (final photo in sorted) {
    if (current.isEmpty) {
      current = [photo];
      continue;
    }
    final last = current.last;
    if (photo.at.difference(last.at).inMilliseconds <= eventGapMs) {
      current.add(photo);
    } else {
      buckets.add(current);
      current = [photo];
    }
  }
  if (current.isNotEmpty) buckets.add(current);

  return buckets.where((b) => b.length >= eventMinPhotos).map((bucket) {
    final kind = inferKind(bucket, homeLat: homeLat, homeLng: homeLng);
    final start = bucket.first.at;
    final title = '${kindLabel(kind)} · ${start.day.toString().padLeft(2, '0')}/${start.month.toString().padLeft(2, '0')}';
    return MemoryEvent(
      id: bucket.map((p) => p.id).join('|').hashCode.toRadixString(16),
      photoIds: bucket.map((p) => p.id).toList(),
      startsAt: bucket.first.at,
      endsAt: bucket.last.at,
      kind: kind,
      title: title,
      lat: bucket.first.lat,
      lng: bucket.first.lng,
    );
  }).toList();
}

MemoryEvent? heroEvent(List<MemoryEvent> events) {
  if (events.isEmpty) return null;
  final sorted = [...events]..sort((a, b) {
    final byDate = b.startsAt.compareTo(a.startsAt);
    if (byDate != 0) return byDate;
    return b.photoCount.compareTo(a.photoCount);
  });
  return sorted.first;
}

Map<String, List<MemoryEvent>> eventsByMonth(List<MemoryEvent> events) {
  final sorted = [...events]..sort((a, b) => b.startsAt.compareTo(a.startsAt));
  final map = <String, List<MemoryEvent>>{};
  for (final event in sorted) {
    map.putIfAbsent(formatMonthHeader(event.startsAt), () => []).add(event);
  }
  return map;
}

List<MemorySuggestion> suggestionsFor(List<MemoryEvent> events) {
  final live = [...events]..sort((a, b) => b.photoCount.compareTo(a.photoCount));
  final cards = live.take(3).map((event) {
    final title = switch (event.kind) {
      'VOYAGE' => 'Voyage détecté',
      'FETE' => 'Célébration détectée',
      'JOURNEE' => 'Journée détectée',
      _ => 'Événement détecté',
    };
    return MemorySuggestion(
      id: 'sug-${event.id}',
      kind: event.kind,
      title: title,
      body: 'Ces ${event.photoCount} photos semblent appartenir au même moment.',
      eventId: event.id,
    );
  }).toList();
  if (events.isNotEmpty) {
    cards.add(
      const MemorySuggestion(
        id: 'sug-faces-soon',
        kind: 'PERSONNES',
        title: 'Personnes',
        body: 'Aucun visage n’est encore associé sur l’appareil. Aucun nom n’est inventé.',
        eventId: '',
      ),
    );
  }
  return cards;
}

({double? lat, double? lng}) homeLocation(List<PhotoStamp> photos) {
  final gps = photos.where((p) => p.lat != null && p.lng != null).toList();
  if (gps.isEmpty) return (lat: null, lng: null);
  final lat = gps.map((p) => p.lat!).reduce((a, b) => a + b) / gps.length;
  final lng = gps.map((p) => p.lng!).reduce((a, b) => a + b) / gps.length;
  return (lat: lat, lng: lng);
}
