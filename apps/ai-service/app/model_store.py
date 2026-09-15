"""Download Apache-2.0 OpenCV Zoo models used by the V1 provider."""

from __future__ import annotations

import sys
import urllib.request
from pathlib import Path

MODELS = {
    "face_detection_yunet_2023mar.onnx": [
        "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
        "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
    ],
    "face_recognition_sface_2021dec.onnx": [
        "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
        "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
    ],
}


def models_dir() -> Path:
    return Path(__file__).resolve().parent.parent / "models"


def download_file(urls: list[str], dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    last_error: Exception | None = None
    for url in urls:
        try:
            print(f"Downloading {url}")
            urllib.request.urlretrieve(url, dest)
            if dest.stat().st_size < 10_000:
                dest.unlink(missing_ok=True)
                raise RuntimeError(f"Downloaded file too small: {url}")
            print(f"Saved {dest} ({dest.stat().st_size} bytes)")
            return
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            print(f"Failed {url}: {exc}")
    raise RuntimeError(f"Could not download {dest.name}") from last_error


def ensure_models() -> tuple[Path, Path]:
    directory = models_dir()
    paths: list[Path] = []
    for name, urls in MODELS.items():
        path = directory / name
        if not path.exists() or path.stat().st_size < 10_000:
            download_file(urls, path)
        paths.append(path)
    return paths[0], paths[1]


if __name__ == "__main__":
    try:
        ensure_models()
    except Exception as error:  # noqa: BLE001
        print(error, file=sys.stderr)
        sys.exit(1)
