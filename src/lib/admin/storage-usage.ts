import { createServiceClient } from "@/lib/supabase/service";

export type UserStorageUsage = {
  storageBytes: number;
  bookCount: number;
};

function parseObjectSize(metadata: unknown): number {
  if (!metadata || typeof metadata !== "object") return 0;
  const size = (metadata as Record<string, unknown>).size;
  if (typeof size === "number" && Number.isFinite(size)) return size;
  if (typeof size === "string") {
    const parsed = Number.parseInt(size, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

async function listFolderBytes(bucket: string, folder: string): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 1000,
  });

  if (error) {
    throw new Error(`Could not list ${bucket}/${folder}: ${error.message}`);
  }

  let total = 0;
  for (const file of data ?? []) {
    if (!file.name || file.name.endsWith("/")) continue;
    total += parseObjectSize(file.metadata);
  }
  return total;
}

async function getStorageUsageFromObjectsTable(): Promise<Map<string, number> | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .schema("storage")
    .from("objects")
    .select("name, metadata")
    .in("bucket_id", ["book-pdfs", "book-covers"]);

  if (error) {
    return null;
  }

  const usage = new Map<string, number>();
  for (const object of data ?? []) {
    const name = object.name as string | null;
    if (!name) continue;
    const userId = name.split("/")[0];
    if (!userId) continue;
    usage.set(userId, (usage.get(userId) ?? 0) + parseObjectSize(object.metadata));
  }

  return usage;
}

async function getStorageUsageByListing(userIds: string[]): Promise<Map<string, number>> {
  const usage = new Map<string, number>();
  await Promise.all(
    userIds.map(async (userId) => {
      const [pdfBytes, coverBytes] = await Promise.all([
        listFolderBytes("book-pdfs", userId),
        listFolderBytes("book-covers", userId),
      ]);
      usage.set(userId, pdfBytes + coverBytes);
    }),
  );
  return usage;
}

export async function getBookCountByUserId(): Promise<Map<string, number>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("books").select("user_id");

  if (error) {
    throw new Error(error.message);
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const userId = row.user_id as string;
    counts.set(userId, (counts.get(userId) ?? 0) + 1);
  }
  return counts;
}

export async function getStorageUsageByUserId(
  userIds: string[],
): Promise<Map<string, number>> {
  const fromTable = await getStorageUsageFromObjectsTable();
  if (fromTable) {
    return fromTable;
  }

  const idsWithPossibleStorage = userIds.filter(Boolean);
  if (idsWithPossibleStorage.length === 0) {
    return new Map();
  }

  return getStorageUsageByListing(idsWithPossibleStorage);
}

export async function getUserStorageUsageMap(
  userIds: string[],
): Promise<Map<string, UserStorageUsage>> {
  const [bytesByUser, bookCounts] = await Promise.all([
    getStorageUsageByUserId(userIds),
    getBookCountByUserId(),
  ]);

  const result = new Map<string, UserStorageUsage>();
  for (const userId of userIds) {
    result.set(userId, {
      storageBytes: bytesByUser.get(userId) ?? 0,
      bookCount: bookCounts.get(userId) ?? 0,
    });
  }
  return result;
}

export async function getPlatformStorageBytes(): Promise<number> {
  const fromTable = await getStorageUsageFromObjectsTable();
  if (fromTable) {
    let total = 0;
    for (const bytes of fromTable.values()) {
      total += bytes;
    }
    return total;
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("books").select("user_id");
  if (error) {
    throw new Error(error.message);
  }

  const userIds = [...new Set((data ?? []).map((row) => row.user_id as string))];
  const usage = await getStorageUsageByListing(userIds);
  let total = 0;
  for (const bytes of usage.values()) {
    total += bytes;
  }
  return total;
}

export function formatStorageBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const digits = value >= 100 || unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[unitIndex]}`;
}
