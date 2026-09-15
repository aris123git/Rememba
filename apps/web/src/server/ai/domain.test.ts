import { describe, expect, it } from "vitest";
import { parseAgentQuery } from "./agentParse";
import { clusterBySimilarity, nearestCentroid } from "./cluster";
import { groupRichEvents } from "./eventIntelligence";
import { groupByTimeWindows } from "./eventWindows";
import { clusterByDistance, haversineKm } from "./geo";
import { qualityScore } from "./imageStats";
import { dHashFromGray9x8, groupDuplicates, hammingHex } from "./phash";
import { groupBursts } from "./series";
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

describe("geo clustering", () => {
  it("groups GPS points within 150m", () => {
    expect(haversineKm(48.8566, 2.3522, 48.8567, 2.3523)).toBeLessThan(0.15);
    const clusters = clusterByDistance(
      [
        { id: "a", lat: 48.8566, lng: 2.3522 },
        { id: "b", lat: 48.8567, lng: 2.3523 },
        { id: "c", lat: 45.75, lng: 4.85 },
      ],
      0.15,
    );
    expect(clusters).toHaveLength(2);
    expect(clusters.find((c) => c.photoIds.includes("a"))?.photoIds).toEqual(
      expect.arrayContaining(["a", "b"]),
    );
  });
});

describe("dHash / duplicates", () => {
  it("groups near-identical hashes", () => {
    const pixels = new Uint8Array(72);
    for (let i = 0; i < 72; i += 1) pixels[i] = i;
    const hash = dHashFromGray9x8(pixels);
    expect(hash).toHaveLength(16);
    expect(hammingHex(hash, hash)).toBe(0);
    const groups = groupDuplicates(
      [
        { id: "1", phash: "aaaaaaaaaaaaaaaa" },
        { id: "2", phash: "aaaaaaaaaaaaaaab" },
        { id: "3", phash: "ffffffffffffffff" },
      ],
      8,
    );
    expect(groups.some((g) => g.includes("1") && g.includes("2"))).toBe(true);
    expect(groups.some((g) => g.includes("3") && g.length === 1)).toBe(false);
  });
});

describe("bursts", () => {
  it("groups photos taken a few seconds apart", () => {
    const t = new Date("2026-06-01T12:00:00Z").getTime();
    const bursts = groupBursts([
      { id: "a", at: new Date(t) },
      { id: "b", at: new Date(t + 3000) },
      { id: "c", at: new Date(t + 60_000) },
    ]);
    expect(bursts).toHaveLength(1);
    expect(bursts[0].photoIds).toEqual(["a", "b"]);
  });
});

describe("rich events", () => {
  it("splits a time window by distinct places and never auto-creates", () => {
    const hour = 60 * 60 * 1000;
    const base = new Date("2026-07-01T10:00:00Z").getTime();
    const windows = groupRichEvents(
      [
        { id: "1", at: new Date(base), placeId: "p1", personIds: ["alice", "bob"] },
        { id: "2", at: new Date(base + hour), placeId: "p1", personIds: ["alice"] },
        { id: "3", at: new Date(base + 2 * hour), placeId: "p1", personIds: ["bob"] },
        { id: "4", at: new Date(base + 0.5 * hour), placeId: "p2", personIds: [] },
        { id: "5", at: new Date(base + 1.5 * hour), placeId: "p2", personIds: [] },
        { id: "6", at: new Date(base + 2.2 * hour), placeId: "p2", personIds: [] },
      ],
      3 * hour,
      3,
    );
    expect(windows.length).toBeGreaterThanOrEqual(1);
    expect(windows.every((w) => w.photoIds.length >= 3)).toBe(true);
    expect(windows.some((w) => w.confidence === "HIGH" || w.confidence === "MEDIUM")).toBe(true);
  });
});

describe("qualityScore", () => {
  it("penalizes duplicates", () => {
    const good = qualityScore({ sharpness: 0.8, width: 4000, height: 3000, maxFaceScore: 0.9 });
    const dup = qualityScore({
      sharpness: 0.8,
      width: 4000,
      height: 3000,
      maxFaceScore: 0.9,
      isDuplicate: true,
    });
    expect(good).toBeGreaterThan(dup);
  });
});

describe("agent parser", () => {
  it("maps French queries to tools without inventing actions", () => {
    expect(parseAgentQuery("photos de Marie")[0]).toMatchObject({
      tool: "searchPhotos",
      args: { personName: "Marie" },
    });
    expect(parseAgentQuery("montre les doublons").some((c) => c.tool === "searchPhotos" && c.args.duplicates)).toBe(
      true,
    );
    expect(parseAgentQuery("il y a un an")[0].tool).toBe("thisDayLastYear");
    expect(parseAgentQuery("").some((c) => c.tool === "help")).toBe(true);
  });
});
