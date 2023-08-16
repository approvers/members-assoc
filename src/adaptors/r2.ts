import type { Store } from "../services/patch-members";

export class R2Store implements Store {
    constructor(private readonly bucket: R2Bucket) {}

    async put(id: string, entry: unknown): Promise<void> {
        await this.bucket.put(id, JSON.stringify(entry));
    }
}
