export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  if (denom === 0) return 0;
  return dot / denom;
}

export function l2Normalize(vector: Float32Array): Float32Array {
  let n = 0;
  for (let i = 0; i < vector.length; i += 1) n += vector[i] * vector[i];
  n = Math.sqrt(n);
  const out = new Float32Array(vector.length);
  if (n === 0) return out;
  for (let i = 0; i < vector.length; i += 1) out[i] = vector[i] / n;
  return out;
}

export function meanNormalized(vectors: Float32Array[]): Float32Array {
  if (vectors.length === 0) return new Float32Array();
  const dim = vectors[0].length;
  const acc = new Float32Array(dim);
  for (const vector of vectors) {
    const normalized = l2Normalize(vector);
    for (let i = 0; i < dim; i += 1) acc[i] += normalized[i];
  }
  for (let i = 0; i < dim; i += 1) acc[i] /= vectors.length;
  return l2Normalize(acc);
}

export function float32ToBuffer(values: number[] | Float32Array): Buffer {
  const array = values instanceof Float32Array ? values : Float32Array.from(values);
  return Buffer.from(array.buffer, array.byteOffset, array.byteLength);
}

export function bufferToFloat32(buffer: Buffer | Uint8Array): Float32Array {
  const aligned = Buffer.from(buffer);
  return new Float32Array(aligned.buffer, aligned.byteOffset, aligned.byteLength / 4);
}
