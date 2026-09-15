from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

from app.providers.base import FaceRecognitionProvider
from app.schemas import DetectedFace

MODEL_ID = "opencv-yunet-2023mar+sface-2021dec"


class OpenCvSFaceProvider(FaceRecognitionProvider):
    model_id = MODEL_ID

    def __init__(self, detection_model: Path, recognition_model: Path, score_threshold: float = 0.6):
        self.detection_model = detection_model
        self.recognition_model = recognition_model
        self.score_threshold = score_threshold
        self._detector: cv2.FaceDetectorYN | None = None
        self._recognizer: cv2.FaceRecognizerSF | None = None
        self._input_size: tuple[int, int] | None = None

    def _ensure(self, width: int, height: int) -> None:
        size = (max(width, 1), max(height, 1))
        if self._detector is None:
            self._detector = cv2.FaceDetectorYN.create(
                str(self.detection_model),
                "",
                size,
                self.score_threshold,
                0.3,
                5000,
            )
            self._recognizer = cv2.FaceRecognizerSF.create(str(self.recognition_model), "")
            self._input_size = size
            return
        if self._input_size != size:
            self._detector.setInputSize(size)
            self._input_size = size

    def detect_faces(self, image_bgr: np.ndarray) -> list[DetectedFace]:
        height, width = image_bgr.shape[:2]
        self._ensure(width, height)
        assert self._detector is not None
        _retval, faces = self._detector.detect(image_bgr)
        if faces is None:
            return []
        results: list[DetectedFace] = []
        for row in faces:
            x, y, w, h = [float(v) for v in row[:4]]
            score = float(row[-1])
            landmarks = [float(v) for v in row[4:-1]]
            results.append(
                DetectedFace(
                    x=max(x, 0.0),
                    y=max(y, 0.0),
                    width=max(w, 0.0),
                    height=max(h, 0.0),
                    score=score,
                    landmarks=landmarks,
                )
            )
        return results

    def generate_embedding(self, image_bgr: np.ndarray, face: DetectedFace) -> np.ndarray:
        height, width = image_bgr.shape[:2]
        self._ensure(width, height)
        assert self._recognizer is not None
        face_row = np.array(face.as_yunet_row(), dtype=np.float32)
        aligned = self._recognizer.alignCrop(image_bgr, face_row)
        feature = self._recognizer.feature(aligned)
        vector = np.asarray(feature, dtype=np.float32).ravel()
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return vector.astype(np.float32)
