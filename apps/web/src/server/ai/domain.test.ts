import { describe, expect, it } from "vitest";
import { clusterBySimilarity, nearestCentroid } from "./cluster";
import { groupByTimeWindows } from "./eventWindows";
import { cosineSimilarity, meanNormalized } from "./vectors";

function vec(...values: number[]) {
  return Float32Array.from(values);
}

describe("cosine similarity", () => {
  it("is 1 for identical vectors", () => {
    expect(cosineSimilarity(vec(1, 0, 0), vec(1, 0, 0))).toBeCloseTo(1);
  });
});

describe("clusterBySimilarity", () => {
  it("groups nearby embeddings and keeps outliers apart", () => {
    const groups = clusterBySimilarity(
      [
        { id: "a", vector: vec(1, 0, 0) },
        { id: "b", vector: vec(0.99, 0.01, 0) },
        { id: "c", vector: vec(0, 1, 0) },
      ],
      0.9,
    );
    const frozen = groups.map((g) => [...g].sort().join("+")).sort();
    expect(frozen).toEqual(["a+b", "c"]);
  });
});

describe("nearestCentroid", () => {
  it("returns null below threshold so identity stays a suggestion", () => {
    const match = nearestCentroid(vec(1, 0), [{ id: "p", vector: vec(0, 1) }], 0.5);
    expect(match).toBeNull();
  });
});

describe("meanNormalized", () => {
  it("averages unit vectors", () => {
    const mean = meanNormalized([vec(1, 0), vec(1, 0)]);
    expect(mean[0]).toBeCloseTo(1);
  });
});

describe("groupByTimeWindows", () => {
  it("builds event candidates from close timestamps only", () => {
    const hour = 60 * 60 * 1000;
    const base = new Date("2026-04-01T10:00:00Z").getTime();
    const windows = groupByTimeWindows(
      [
        { id: "1", at: new Date(base) },
        { id: "2", at: new Date(base + hour) },
        { id: "3", at: new Date(base + 2 * hour) },
        { id: "4", at: new Date(base + 48 * hour), alreadyInEvent: false },
        { id: "5", at: new Date(base + 3 * hour), alreadyInEvent: true },
      ],
      3 * hour,
      3,
    );
    expect(windows).toHaveLength(1);
    expect(windows[0].photoIds).toEqual(["1", "2", "3"]);
  });
});
