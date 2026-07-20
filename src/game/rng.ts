// src/game/rng.ts
// Deterministic RNG: xfnv1a hash + mulberry32 PRNG

export function xfnv1a(str: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h += h << 13; h ^= h >>> 7; h += h << 3; h ^= h >>> 17; h += h << 5;
      return h >>> 0;
    };
  }
  
  export function mulberry32(a: number) {
    return function () {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  
  export function seededRandom(seed: string) {
    const seedToInt = xfnv1a(seed)();
    return mulberry32(seedToInt);
  }
  
  export function pickWeighted<T>(
    items: { item: T; weight: number }[],
    rand: () => number
  ): T | null {
    const total = items.reduce((s, x) => s + (x.weight || 0), 0);
    if (total <= 0) return null;
    let r = rand() * total;
    for (const { item, weight } of items) {
      r -= weight || 0;
      if (r <= 0) return item;
    }
    return items[items.length - 1].item;
  }
  