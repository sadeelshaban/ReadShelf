import { createClient } from "@/lib/supabase/client";
import {
  idbDelete,
  idbGetAll,
  idbGetAllByIndex,
  idbPut,
} from "@/lib/offline/db";
import { isOnline } from "@/lib/offline/online";

type SyncEntity = "highlight" | "note" | "book";
type SyncOp = "insert" | "update" | "delete";

type SyncQueueItem = {
  id: string;
  entity: SyncEntity;
  op: SyncOp;
  recordId: string;
  payload: Record<string, unknown>;
  createdAt: string;
  status: "pending" | "in_flight" | "done" | "failed";
  retries: number;
  lastError?: string;
};

const MAX_RETRIES = 5;

export async function enqueueSync(item: Omit<SyncQueueItem, "status" | "retries">) {
  await idbPut<SyncQueueItem>("syncQueue", {
    ...item,
    status: "pending",
    retries: 0,
  });
}

export async function removeSyncItemsForRecord(recordId: string) {
  const all = await idbGetAll<SyncQueueItem>("syncQueue");
  await Promise.all(
    all
      .filter((item) => item.recordId === recordId && item.status === "pending")
      .map((item) => idbDelete("syncQueue", item.id)),
  );
}

async function getPendingItems() {
  const pending = await idbGetAllByIndex<SyncQueueItem>(
    "syncQueue",
    "status",
    "pending",
  );
  return pending.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export async function flushSyncQueue() {
  if (!isOnline()) return { synced: 0, failed: 0 };

  const supabase = createClient();
  const pending = await getPendingItems();
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    await idbPut<SyncQueueItem>("syncQueue", {
      ...item,
      status: "in_flight",
    });

    try {
      if (item.entity === "highlight") {
        if (item.op === "insert") {
          const { error } = await supabase.from("highlights").insert(item.payload);
          if (error) throw error;
        } else if (item.op === "delete") {
          const { error } = await supabase
            .from("highlights")
            .delete()
            .eq("id", item.recordId);
          if (error) throw error;
        }
      } else if (item.entity === "note") {
        if (item.op === "insert") {
          const { error } = await supabase.from("notes").insert(item.payload);
          if (error) throw error;
        } else if (item.op === "update") {
          const { error } = await supabase
            .from("notes")
            .update(item.payload)
            .eq("id", item.recordId);
          if (error) throw error;
        } else if (item.op === "delete") {
          const { error } = await supabase
            .from("notes")
            .delete()
            .eq("id", item.recordId);
          if (error) throw error;
        }
      } else if (item.entity === "book") {
        if (item.op === "update") {
          const { error } = await supabase
            .from("books")
            .update(item.payload)
            .eq("id", item.recordId);
          if (error) throw error;
        }
      }

      await idbDelete("syncQueue", item.id);
      synced += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      const retries = item.retries + 1;
      if (retries >= MAX_RETRIES) {
        await idbPut<SyncQueueItem>("syncQueue", {
          ...item,
          status: "failed",
          retries,
          lastError: message,
        });
        failed += 1;
      } else {
        await idbPut<SyncQueueItem>("syncQueue", {
          ...item,
          status: "pending",
          retries,
          lastError: message,
        });
      }
    }
  }

  return { synced, failed };
}
