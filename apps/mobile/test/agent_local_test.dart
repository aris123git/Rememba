import 'package:flutter_test/flutter_test.dart';
import 'package:rememba/local/agent_local.dart';
import 'package:rememba/local/format.dart';
import 'package:rememba/local/memory_model.dart';

List<MemoryEvent> _sample() {
  return [
    MemoryEvent(
      id: 'v',
      photoIds: List.generate(10, (i) => 'v$i'),
      startsAt: DateTime(2025, 7, 2, 11),
      endsAt: DateTime(2025, 7, 2, 18),
      kind: 'VOYAGE',
      title: 'Voyage · 02/07',
    ),
    MemoryEvent(
      id: 'f',
      photoIds: List.generate(20, (i) => 'f$i'),
      startsAt: DateTime(2026, 9, 12, 19),
      endsAt: DateTime(2026, 9, 12, 23),
      kind: 'FETE',
      title: 'Célébration · 12/09',
    ),
  ];
}

void main() {
  test('refuses to invent a named person', () {
    final reply = interpretQuery('Montre-moi toutes mes photos avec Paul.', _sample());
    expect(reply.events, isEmpty);
    expect(reply.text.toLowerCase(), contains('visage'));
    expect(reply.text.toLowerCase(), isNot(contains('paul a')));
  });

  test('finds travel moments and can open video studio', () {
    final reply = interpretQuery('Fais-moi une vidéo de mon voyage', _sample());
    expect(reply.openVideo, isTrue);
    expect(reply.events, hasLength(1));
    expect(reply.events.first.kind, 'VOYAGE');
  });

  test('filters 2025 souvenirs', () {
    final reply = interpretQuery('Quels sont mes meilleurs souvenirs de 2025 ?', _sample());
    expect(reply.events.every((e) => e.startsAt.year == 2025), isTrue);
  });

  test('short month label does not crash on mai', () {
    expect(formatShortDay(DateTime(2026, 5, 3)), '03 MAI.');
  });

  test('groups photos by day newest first, like a gallery', () {
    final items = [
      DateTime(2026, 9, 12, 18),
      DateTime(2026, 9, 12, 9),
      DateTime(2026, 9, 3, 11),
    ];
    final sections = groupByDay(items, (d) => d);
    expect(sections, hasLength(2));
    expect(sections.first.day, DateTime(2026, 9, 12));
    expect(sections.first.items, hasLength(2));
    expect(formatGalleryDay(DateTime(2026, 9, 12), now: DateTime(2026, 9, 15)), '12 septembre');
  });
}
