from __future__ import annotations

import numpy as np


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    a = a.astype(np.float64).ravel()
    b = b.astype(np.float64).ravel()
    denom = float(np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def cluster_faces(
    members: list[tuple[str, np.ndarray]],
    threshold: float,
) -> list[list[str]]:
    """Union-find clustering on cosine similarity. O(n²) — acceptable for V1 libraries."""
    n = len(members)
    parent = list(range(n))

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def union(i: int, j: int) -> None:
        ri, rj = find(i), find(j)
        if ri != rj:
            parent[ri] = rj

    for i in range(n):
        for j in range(i + 1, n):
            if cosine_similarity(members[i][1], members[j][1]) >= threshold:
                union(i, j)

    groups: dict[int, list[str]] = {}
    for i in range(n):
        groups.setdefault(find(i), []).append(members[i][0])
    return list(groups.values())


def suggest_identity(
    query: np.ndarray,
    gallery: list[tuple[str, np.ndarray, str | None]],
    threshold: float,
) -> tuple[str | None, float, str | None]:
    best_id: str | None = None
    best_sim = -1.0
    best_label: str | None = None
    for cid, vector, label in gallery:
        sim = cosine_similarity(query, vector)
        if sim > best_sim:
            best_sim = sim
            best_id = cid
            best_label = label
    if best_id is None or best_sim < threshold:
        return None, best_sim if best_sim >= 0 else 0.0, None
    return best_id, best_sim, best_label
