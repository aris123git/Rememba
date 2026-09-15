import fs from "node:fs/promises";
import path from "node:path";
import { storageRoot } from "@/lib/config";

export interface StorageProvider {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  deletePrefix(prefix: string): Promise<void>;
}

export class LocalDiskStorage implements StorageProvider {
  constructor(private readonly root: string) {}

  private resolveKey(key: string): string {
    const resolved = path.resolve(this.root, key);
    const base = path.resolve(this.root);
    if (resolved !== base && !resolved.startsWith(base + path.sep)) {
      throw new Error("Clé de stockage invalide");
    }
    return resolved;
  }

  async put(key: string, data: Buffer): Promise<void> {
    const dest = this.resolveKey(key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, data);
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(this.resolveKey(key));
  }

  async deletePrefix(prefix: string): Promise<void> {
    await fs.rm(this.resolveKey(prefix), { recursive: true, force: true });
  }
}

let singleton: StorageProvider | undefined;

export function getStorage(): StorageProvider {
  singleton ??= new LocalDiskStorage(storageRoot());
  return singleton;
}
