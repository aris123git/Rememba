import { cosineSimilarity } from "@/server/ai/vectors";

export function clusterBySimilarity(
  items: { id: string; vector: Float32Array }[],
  threshold: number,
): string[][] {
  const parent = items.map((_, index) => index);

  const find = (index: number): number => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  };

  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (cosineSimilarity(items[i].vector, items[j].vector) >= threshold) {
        union(i, j);
      }
    }
  }

  const groups = new Map<number, string[]>();
  for (let i = 0; i < items.length; i += 1) {
    const root = find(i);
    const list = groups.get(root) ?? [];
    list.push(items[i].id);
    groups.set(root, list);
  }
  return [...groups.values()];
}

export function nearestCentroid(
  query: Float32Array,
  centroids: { id: string; vector: Float32Array }[],
  threshold: number,
): { id: string; similarity: number } | null {
  let best: { id: string; similarity: number } | null = null;
  for (const centroid of centroids) {
    const similarity = cosineSimilarity(query, centroid.vector);
    if (similarity >= threshold && (!best || similarity > best.similarity)) {
      best = { id: centroid.id, similarity };
    }
  }
  return best;
}
