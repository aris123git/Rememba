// This is a basic Flutter widget test placeholder replaced by unit tests.
import 'package:flutter_test/flutter_test.dart';
import 'package:rememba/ai/vision_backend.dart';

void main() {
  test('cloud vision is the V1 default', () {
    expect(const CloudVisionBackend().id, 'cloud');
  });
}
