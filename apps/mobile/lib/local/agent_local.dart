import 'package:rememba/local/memory_model.dart';

class LocalAgentReply {
  const LocalAgentReply({
    required this.text,
    this.events = const [],
    this.openVideo = false,
  });

  final String text;
  final List<MemoryEvent> events;
  final bool openVideo;
}

final _year = RegExp(r'(19|20)\d{2}');

const _months = {
  'janvier': 1,
  'février': 2,
  'fevrier': 2,
  'mars': 3,
  'avril': 4,
  'mai': 5,
  'juin': 6,
  'juillet': 7,
  'août': 8,
  'aout': 8,
  'septembre': 9,
  'octobre': 10,
  'novembre': 11,
  'décembre': 12,
  'decembre': 12,
};

String _norm(String input) {
  return input
      .toLowerCase()
      .replaceAll(RegExp(r'[^\wàâäéèêëïîôùûüç\s]'), ' ')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
}

LocalAgentReply interpretQuery(String raw, List<MemoryEvent> events, {int photoCount = 0}) {
  final query = _norm(raw);
  if (query.isEmpty) {
    return const LocalAgentReply(text: 'Que voulez-vous retrouver ?');
  }

  if (RegExp(r'\b(paul|marie|sarah|david)\b').hasMatch(query) ||
      query.contains('avec ') && (query.contains('photo') || query.contains('photos'))) {
    return const LocalAgentReply(
      text:
          'Je ne reconnais pas encore les visages sur cet appareil, donc je n’invente aucun prénom. Demandez-moi un voyage, une célébration, une année ou un mois.',
    );
  }

  var filtered = [...events];

  final yearMatch = _year.firstMatch(query);
  if (yearMatch != null) {
    final year = int.parse(yearMatch.group(0)!);
    filtered = filtered.where((e) => e.startsAt.year == year).toList();
  }

  for (final entry in _months.entries) {
    if (query.contains(entry.key)) {
      filtered = filtered.where((e) => e.startsAt.month == entry.value).toList();
      break;
    }
  }

  if (query.contains('voyage') || query.contains('vacance')) {
    filtered = filtered.where((e) => e.kind == 'VOYAGE').toList();
  } else if (query.contains('mariage')) {
    filtered = filtered.where((e) => e.kind == 'MARIAGE').toList();
  } else if (query.contains('concert')) {
    filtered = filtered.where((e) => e.kind == 'CONCERT').toList();
  } else if (query.contains('cérémonie') || query.contains('ceremonie')) {
    filtered = filtered.where((e) => e.kind == 'CEREMONIE').toList();
  } else if (query.contains('anniversaire') ||
      query.contains('fête') ||
      query.contains('fete') ||
      query.contains('célébration') ||
      query.contains('celebration')) {
    filtered = filtered.where((e) => e.kind == 'FETE').toList();
  }

  final wantsVideo = query.contains('vidéo') ||
      query.contains('video') ||
      query.contains('film') ||
      query.contains('movie');
  final wantsBest = query.contains('meilleur') || query.contains('best') || query.contains('plus beau');

  if (wantsBest) {
    filtered = [...filtered]..sort((a, b) => b.photoCount.compareTo(a.photoCount));
    filtered = filtered.take(3).toList();
  } else {
    filtered = [...filtered]..sort((a, b) => b.startsAt.compareTo(a.startsAt));
  }

  if (wantsVideo) {
    final target = filtered.isNotEmpty ? filtered.first : heroEvent(events);
    if (target == null) {
      return const LocalAgentReply(
        text: 'Il me faut un moment de quelques photos pour composer une vidéo souvenir.',
      );
    }
    return LocalAgentReply(
      text:
          'Je peux composer un souvenir filmé à partir de « ${target.title} » (${target.photoCount} photos). Rien n’est envoyé tant que vous ne générez pas.',
      events: [target],
      openVideo: true,
    );
  }

  if (filtered.isEmpty) {
    if (photoCount == 0) {
      return const LocalAgentReply(
        text: 'Votre photothèque n’est pas encore lisible. Autorisez les photos, puis redemandez-moi.',
      );
    }
    return LocalAgentReply(
      text:
          'Je n’ai pas trouvé de moment correspondant. J’ai ${events.length} moment${events.length > 1 ? 's' : ''} organisé${events.length > 1 ? 's' : ''} à partir de $photoCount photo${photoCount > 1 ? 's' : ''}.',
    );
  }

  if (filtered.length == 1) {
    final event = filtered.first;
    return LocalAgentReply(
      text: 'Voici « ${event.title} » : ${event.photoCount} photos, regroupées par l’IA à partir des dates.',
      events: filtered,
    );
  }

  return LocalAgentReply(
    text:
        'J’ai trouvé ${filtered.length} moments. L’IA les a organisés à partir de vos photos, sans inventer de titres personnels.',
    events: filtered.take(8).toList(),
  );
}
