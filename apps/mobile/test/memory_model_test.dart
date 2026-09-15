import 'package:flutter_test/flutter_test.dart';
import 'package:rememba/local/memory_model.dart';

void main() {
  test('groups close photos into an event and never invents a name', () {
    final base = DateTime(2026, 9, 12, 18);
    final photos = List.generate(
      5,
      (i) => PhotoStamp(id: '$i', at: base.add(Duration(minutes: 20 * i))),
    );
    final events = groupEvents(photos);
    expect(events, hasLength(1));
    expect(events.first.photoCount, 5);
    expect(events.first.title.toLowerCase(), isNot(contains('sarah')));
  });

  test('evening burst is a celebration without a personal title', () {
    final photos = List.generate(
      12,
      (i) => PhotoStamp(id: '$i', at: DateTime(2026, 9, 12, 19, i)),
    );
    final events = groupEvents(photos);
    expect(events, hasLength(1));
    expect(events.first.kind, 'FETE');
    expect(events.first.title.toLowerCase(), isNot(contains('sarah')));
    expect(events.first.title.toLowerCase(), isNot(contains('anniversaire')));
  });

  test('keeps distant days apart', () {
    final photos = [
      PhotoStamp(id: 'a', at: DateTime(2026, 9, 3, 10)),
      PhotoStamp(id: 'b', at: DateTime(2026, 9, 3, 11)),
      PhotoStamp(id: 'c', at: DateTime(2026, 9, 3, 12)),
      PhotoStamp(id: 'd', at: DateTime(2026, 9, 12, 10)),
    ];
    expect(groupEvents(photos), hasLength(1));
  });
}
