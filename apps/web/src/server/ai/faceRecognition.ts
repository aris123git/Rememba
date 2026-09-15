import { aiServiceUrl } from "@/lib/config";

export type AnalyzedFace = {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
  embedding: number[];
  model_id: string;
  dimensions: number;
};

export interface FaceRecognitionService {
  detectAndEmbed(image: Buffer, mimeType: string): Promise<AnalyzedFace[]>;
}

export class HttpFaceRecognitionService implements FaceRecognitionService {
  constructor(private readonly baseUrl: string) {}

  async detectAndEmbed(image: Buffer, mimeType: string): Promise<AnalyzedFace[]> {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(image)], { type: mimeType }), "photo.jpg");
    const response = await fetch(`${this.baseUrl}/v1/analyze`, {
      method: "POST",
      body: form,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`FaceRecognitionService ${response.status}: ${text}`);
    }
    const body = (await response.json()) as { faces: AnalyzedFace[] };
    return body.faces ?? [];
  }
}

let client: FaceRecognitionService | undefined;

export function getFaceRecognitionService(): FaceRecognitionService {
  client ??= new HttpFaceRecognitionService(aiServiceUrl());
  return client;
}
