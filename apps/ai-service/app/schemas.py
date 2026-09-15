from __future__ import annotations

from pydantic import BaseModel, Field


class Landmark(BaseModel):
    x: float
    y: float


class DetectedFace(BaseModel):
    x: float
    y: float
    width: float
    height: float
    score: float
    landmarks: list[float] = Field(default_factory=list)

    def as_yunet_row(self) -> list[float]:
        row = [self.x, self.y, self.width, self.height]
        if len(self.landmarks) >= 10:
            row.extend(self.landmarks[:10])
        else:
            row.extend([0.0] * 10)
        row.append(self.score)
        return row


class FaceEmbeddingResult(BaseModel):
    vector: list[float]
    model_id: str
    dimensions: int


class AnalyzedFace(BaseModel):
    x: float
    y: float
    width: float
    height: float
    score: float
    landmarks: list[float] = Field(default_factory=list)
    embedding: list[float]
    model_id: str
    dimensions: int


class AnalyzeResponse(BaseModel):
    faces: list[AnalyzedFace]
    provider: str
    model_id: str


class CompareResponse(BaseModel):
    similarity: float


class ClusterMember(BaseModel):
    id: str
    vector: list[float]


class ClusterGroup(BaseModel):
    member_ids: list[str]


class ClusterResponse(BaseModel):
    clusters: list[ClusterGroup]


class IdentityCandidate(BaseModel):
    id: str
    vector: list[float]
    label: str | None = None


class IdentitySuggestion(BaseModel):
    candidate_id: str | None
    similarity: float
    label: str | None = None
    is_suggestion: bool = True
