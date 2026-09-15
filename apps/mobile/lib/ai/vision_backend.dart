/// Where computer vision runs. The UI must never import a model package.
///
/// V1: cloud only (backend AI Orchestrator → FaceRecognitionService).
/// Future: on-device embeddings + sync, without sending every original.
abstract class VisionBackend {
  String get id;
  String get label;
}

class CloudVisionBackend implements VisionBackend {
  const CloudVisionBackend();

  @override
  String get id => 'cloud';

  @override
  String get label =>
      'Analyse sur le serveur (V1). Le modèle n’est pas dans l’APK Android.';
}

/// TODO V2 — TFLite / MediaPipe on-device. Same contract, different process.
class OnDeviceVisionBackend implements VisionBackend {
  const OnDeviceVisionBackend();

  @override
  String get id => 'on_device';

  @override
  String get label => 'TODO V2 — détection locale, sync ensuite.';
}
