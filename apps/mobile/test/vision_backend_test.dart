import 'package:flutter_test/flutter_test.dart';
import 'package:rememba/ai/vision_backend.dart';

void main() {
  test('V1 vision backend is cloud, never an Android-bundled model', () {
    const backend = CloudVisionBackend();
    expect(backend.id, 'cloud');
    expect(backend.label.contains('APK'), isTrue);
  });

  test('on-device backend is documented as future work', () {
    const future = OnDeviceVisionBackend();
    expect(future.id, 'on_device');
    expect(future.label.startsWith('TODO'), isTrue);
  });
}
