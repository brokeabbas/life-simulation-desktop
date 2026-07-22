import { describe, expect, it } from "vitest";
import { pickWeighted, seededRandom } from "./rng";

describe("seeded simulation randomness", () => {
  it("replays the same sequence for the same seed", () => {
    const first = seededRandom("world-42");
    const second = seededRandom("world-42");

    expect([first(), first(), first()]).toEqual([
      second(),
      second(),
      second(),
    ]);
  });

  it("selects weighted entries at deterministic boundaries", () => {
    const items = [
      { item: "common", weight: 9 },
      { item: "rare", weight: 1 },
    ];

    expect(pickWeighted(items, () => 0)).toBe("common");
    expect(pickWeighted(items, () => 0.99)).toBe("rare");
  });

  it("returns null when no positive weight exists", () => {
    expect(pickWeighted([{ item: "none", weight: 0 }], () => 0.5)).toBeNull();
  });
});
