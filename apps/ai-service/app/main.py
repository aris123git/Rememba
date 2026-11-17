from __future__ import annotations

import os
from functools import lru_cache
from io import BytesIO

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image

from app.clustering import cluster_faces, cosine_similarity, suggest_identity
from app.providers.opencv_sface import OpenCvSFaceProvider
from app.schemas import (
    AnalyzeResponse,
    AnalyzedFace,
    ClusterGroup,
    ClusterMember,
    ClusterResponse,
    CompareResponse,
    DetectedFace,
    FaceEmbeddingResult,
    IdentityCandidate,
    IdentitySuggestion,
)
from app.model_store import ensure_models

app = FastAPI(
    title="Rememba FaceRecognitionService",
    version="1.0.0",
    description="V1 computer-vision engine. Swap the provider without changing the HTTP contract.",
)


@lru_cache(maxsize=1)
def get_provider() -> OpenCvSFaceProvider:
    det, rec = ensure_models()
    return OpenCvSFaceProvider(det, rec)


def decode_image(data: bytes) -> np.ndarray:
    array = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is not None:
        return image
    try:
        pil = Image.open(BytesIO(data)).convert("RGB")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Image illisible") from exc
    rgb = np.array(pil)
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "face-recognition", "provider": os.getenv("FACE_PROVIDER", "opencv_sface")}


@app.post("/v1/detectFaces")
async def detect_faces_endpoint(file: UploadFile = File(...)) -> dict:
    image = decode_image(await file.read())
    faces = get_provider().detect_faces(image)
    return {"faces": [f.model_dump() for f in faces], "model_id": get_provider().model_id}


@app.post("/v1/generateEmbedding", response_model=FaceEmbeddingResult)
async def generate_embedding_endpoint(file: UploadFile = File(...), face_json: str = "") -> FaceEmbeddingResult:
    import json

    if not face_json:
        raise HTTPException(status_code=400, detail="face_json requis")
    try:
        face = DetectedFace.model_validate(json.loads(face_json))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="face_json invalide") from exc
    image = decode_image(await file.read())
    provider = get_provider()
    vector = provider.generate_embedding(image, face)
    return FaceEmbeddingResult(vector=vector.tolist(), model_id=provider.model_id, dimensions=int(vector.shape[0]))


@app.post("/v1/analyze", response_model=AnalyzeResponse)
async def analyze_endpoint(file: UploadFile = File(...)) -> AnalyzeResponse:
    image = decode_image(await file.read())
    provider = get_provider()
    detected = provider.detect_faces(image)
    analyzed: list[AnalyzedFace] = []
    for face in detected:
        try:
            vector = provider.generate_embedding(image, face)
        except Exception:
            continue
        analyzed.append(
            AnalyzedFace(
                x=face.x,
                y=face.y,
                width=face.width,
                height=face.height,
                score=face.score,
                landmarks=face.landmarks,
                embedding=vector.tolist(),
                model_id=provider.model_id,
                dimensions=int(vector.shape[0]),
            )
        )
    return AnalyzeResponse(faces=analyzed, provider="opencv_sface", model_id=provider.model_id)


@app.post("/v1/compareFaces", response_model=CompareResponse)
def compare_faces_endpoint(payload: dict) -> CompareResponse:
    a = np.array(payload.get("a") or [], dtype=np.float32)
    b = np.array(payload.get("b") or [], dtype=np.float32)
    if a.size == 0 or b.size == 0 or a.size != b.size:
        raise HTTPException(status_code=400, detail="vecteurs invalides")
    return CompareResponse(similarity=cosine_similarity(a, b))


@app.post("/v1/clusterFaces", response_model=ClusterResponse)
def cluster_faces_endpoint(payload: dict) -> ClusterResponse:
    members_raw = payload.get("members") or []
    threshold = float(payload.get("threshold") or os.getenv("FACE_MATCH_THRESHOLD", "0.45"))
    members: list[tuple[str, np.ndarray]] = []
    for item in members_raw:
        parsed = ClusterMember.model_validate(item)
        members.append((parsed.id, np.array(parsed.vector, dtype=np.float32)))
    groups = cluster_faces(members, threshold)
    return ClusterResponse(clusters=[ClusterGroup(member_ids=g) for g in groups])


@app.post("/v1/suggestIdentity", response_model=IdentitySuggestion)
def suggest_identity_endpoint(payload: dict) -> IdentitySuggestion:
    query = np.array(payload.get("query") or [], dtype=np.float32)
    threshold = float(payload.get("threshold") or os.getenv("FACE_MATCH_THRESHOLD", "0.45"))
    gallery: list[tuple[str, np.ndarray, str | None]] = []
    for item in payload.get("gallery") or []:
        candidate = IdentityCandidate.model_validate(item)
        gallery.append((candidate.id, np.array(candidate.vector, dtype=np.float32), candidate.label))
    cid, sim, label = suggest_identity(query, gallery, threshold)
    return IdentitySuggestion(candidate_id=cid, similarity=sim, label=label, is_suggestion=True)


@app.exception_handler(Exception)
async def unhandled(request, exc: Exception):  # type: ignore[no-untyped-def]
    return JSONResponse(status_code=500, content={"detail": str(exc)})
