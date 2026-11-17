from abc import ABC, abstractmethod

import numpy as np

from app.schemas import DetectedFace


class FaceRecognitionProvider(ABC):
    """Swap-point for open-source vs proprietary models."""

    model_id: str

    @abstractmethod
    def detect_faces(self, image_bgr: np.ndarray) -> list[DetectedFace]:
        raise NotImplementedError

    @abstractmethod
    def generate_embedding(self, image_bgr: np.ndarray, face: DetectedFace) -> np.ndarray:
        raise NotImplementedError
