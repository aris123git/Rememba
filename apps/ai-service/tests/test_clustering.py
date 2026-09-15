import numpy as np

from app.clustering import cluster_faces, cosine_similarity, suggest_identity


def test_identical_vectors_are_similar():
    a = np.array([1.0, 0.0, 0.0], dtype=np.float32)
    assert cosine_similarity(a, a) == 1.0


def test_orthogonal_vectors():
    a = np.array([1.0, 0.0], dtype=np.float32)
    b = np.array([0.0, 1.0], dtype=np.float32)
    assert abs(cosine_similarity(a, b)) < 1e-6


def test_cluster_groups_similar_embeddings():
    a = np.array([1.0, 0.0, 0.0], dtype=np.float32)
    b = np.array([0.99, 0.01, 0.0], dtype=np.float32)
    c = np.array([0.0, 1.0, 0.0], dtype=np.float32)
    groups = cluster_faces([("a", a), ("b", b), ("c", c)], threshold=0.9)
    grouped = {frozenset(g) for g in groups}
    assert frozenset({"a", "b"}) in grouped
    assert frozenset({"c"}) in grouped


def test_suggest_identity_is_never_certain():
    query = np.array([1.0, 0.0], dtype=np.float32)
    gallery = [("p1", np.array([0.98, 0.02], dtype=np.float32), "Paul")]
    cid, sim, label = suggest_identity(query, gallery, 0.5)
    assert cid == "p1"
    assert label == "Paul"
    assert sim > 0.5
