export function hammingHex(a: string, b: string): number {
  if (!a || !b || a.length !== b.length) return 64;
  const xor = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let bits = xor;
  let count = 0;
  const zero = BigInt(0);
  const one = BigInt(1);
  while (bits > zero) {
    bits &= bits - one;
    count += 1;
  }
  return count;
}

export function bitsToHex(bits: string): string {
  return BigInt(`0b${bits}`).toString(16).padStart(16, "0");
}

/** Difference hash from an 8x9 grayscale row-major buffer. */
export function dHashFromGray9x8(pixels: Uint8Array): string {
  if (pixels.length < 72) throw new Error("buffer 9x8 requis");
  let bits = "";
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const left = pixels[y * 9 + x];
      const right = pixels[y * 9 + x + 1];
      bits += left < right ? "1" : "0";
    }
  }
  return bitsToHex(bits);
}

export const DUPLICATE_HAMMING = 8;

export function groupDuplicates(
  items: { id: string; phash: string }[],
  maxDistance = DUPLICATE_HAMMING,
): string[][] {
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    const p = parent.get(id) ?? id;
    if (p !== id) {
      const root = find(p);
      parent.set(id, root);
      return root;
    }
    return id;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  for (const item of items) parent.set(item.id, item.id);
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (hammingHex(items[i].phash, items[j].phash) <= maxDistance) {
        union(items[i].id, items[j].id);
      }
    }
  }
  const groups = new Map<string, string[]>();
  for (const item of items) {
    const root = find(item.id);
    const list = groups.get(root) ?? [];
    list.push(item.id);
    groups.set(root, list);
  }
  return [...groups.values()].filter((group) => group.length >= 2);
}
