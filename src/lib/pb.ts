import PocketBase from "pocketbase";

export const PB_URL = "https://pbdb2.duckdns.org";

// Custom auth collection name in PocketBase
export const USERS_COLLECTION = "ca_users";

// Singleton PocketBase client. authStore persists to localStorage by default.
export const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

export type User = {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
};

/** Build absolute URL for a file stored on a PB record. */
export function pbFileUrl(
  record: { id: string; collectionId?: string; collectionName?: string },
  filename?: string,
) {
  if (!filename) return "";
  const coll = record.collectionId || record.collectionName || USERS_COLLECTION;
  return `${PB_URL}/api/files/${coll}/${record.id}/${filename}`;
}
