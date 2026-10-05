import "server-only";
import { sql } from "./neon";
import { deleteFirebaseUser } from "./firebase-auth-server";
import {
  neonStorage,
  privateBucket,
  publicBucket,
  deleteObject,
} from "./neon-storage";
import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

async function removePrefix(bucket: string, prefix: string) {
  let continuation: string | undefined;
  do {
    const page = await neonStorage().send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuation,
      }),
    );
    const objects = (page.Contents || []).flatMap((item) =>
      item.Key ? [{ Key: item.Key }] : [],
    );
    if (objects.length) {
      const deleted = await neonStorage().send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: objects, Quiet: true },
        }),
      );
      if (deleted.Errors?.length)
        throw new Error("Some personal storage objects could not be removed");
    }
    continuation = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuation);
}

export async function completeDueDeletions() {
  // Claiming ends the grace period atomically. Recovery cannot race external erasure.
  const claimed = await sql.query("select * from claim_member_deletions()");
  let completed = 0,
    failed = 0;
  for (const record of claimed) {
    const uid = String(record.user_id);
    try {
      if (!/^[A-Za-z0-9_-]+$/.test(uid))
        throw new Error("Unsupported member storage identifier");
      if (!record.storage_deleted_at) {
        for (const prefix of [
          `avatars/${uid}/`,
          `portfolio/${uid}/`,
          `${uid}/avatars/`,
        ])
          await removePrefix(publicBucket(), prefix);
        await removePrefix(privateBucket(), `private/${uid}/`);
        const attachments = await sql.query(
          "select object_key from message_attachments where uploaded_by=$1",
          [uid],
        );
        for (const row of attachments)
          await deleteObject(privateBucket(), String(row.object_key));
        // Completed exchange deliverables are shared contractual records and follow platform retention.
        const migrated = await sql.query(
          "select target_bucket,target_key from firebase_storage_objects where owner_id=$1 and target_key is not null and target_key not like 'exchanges/%'",
          [uid],
        );
        for (const row of migrated)
          if (row.target_bucket)
            await deleteObject(
              String(row.target_bucket),
              String(row.target_key),
            );
        await sql.query(
          "update account_deletion_requests set storage_deleted_at=now() where user_id=$1",
          [uid],
        );
      }
      if (!record.auth_deleted_at) {
        try {
          await deleteFirebaseUser(uid);
        } catch (error) {
          if (
            !(error instanceof Error) ||
            !/USER_NOT_FOUND|user-not-found/.test(error.message)
          )
            throw error;
        }
        await sql.query(
          "update account_deletion_requests set auth_deleted_at=now() where user_id=$1",
          [uid],
        );
      }
      await sql.query("select finalize_member_deletion($1)", [uid]);
      completed++;
    } catch (error) {
      failed++;
      console.error(
        "Account cleanup failed",
        error instanceof Error ? error.message : "Unknown error",
      );
      await sql.query(
        "update account_deletion_requests set claimed_at=null,error=$2 where user_id=$1",
        [
          uid,
          error instanceof Error
            ? error.message.slice(0, 500)
            : "Cleanup failed",
        ],
      );
    }
  }
  return { completed, failed };
}
