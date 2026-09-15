import 'dart:math' as math;

const _months = [
  '',
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

String formatDay(DateTime at) => '${at.day} ${_months[at.month]} ${at.year}';

String formatMonthHeader(DateTime at) => '${_months[at.month].toUpperCase()} ${at.year}';

String formatShortDay(DateTime at) {
  final month = _months[at.month];
  final short = month.length <= 4 ? month.toUpperCase() : month.substring(0, 4).toUpperCase();
  return '${at.day.toString().padLeft(2, '0')} $short.';
}

String formatClock(int seconds) {
  final m = seconds ~/ 60;
  final s = seconds % 60;
  return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
}

double haversineKm(double lat1, double lon1, double lat2, double lon2) {
  const earth = 6371.0;
  final dLat = _rad(lat2 - lat1);
  final dLon = _rad(lon2 - lon1);
  final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(_rad(lat1)) * math.cos(_rad(lat2)) * math.sin(dLon / 2) * math.sin(dLon / 2);
  return 2 * earth * math.asin(math.min(1, math.sqrt(a)));
}

double _rad(double d) => d * math.pi / 180;
