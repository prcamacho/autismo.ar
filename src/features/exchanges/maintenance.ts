import "server-only";
import { exchangeAdmin, recordExchangeFailure } from "./server";
import { deliverNotification, notificationContent } from "./notification";
import { notificationBudget } from "./settings";
import { removeProfilePhoto } from "./photos";

/** One bounded batch. Scheduling belongs to the explicitly configured environment. */
export async function runExchangeMaintenance() {
  const admin = exchangeAdmin();
  if (!admin) throw new Error("MAINTENANCE_UNCONFIGURED");
  const maintenance = await admin.rpc("exchange_maintenance", {});
  if (maintenance.error) throw new Error("MAINTENANCE_DATABASE");
  const summary = {
    ...(maintenance.data?.[0] ?? {
      warned: 0,
      deleted: 0,
      expired: 0,
      notifications_failed: 0,
    }),
    notificationsAccepted: 0,
    notificationsSkipped: 0,
    notificationFailures: 0,
    notificationAckFailures: 0,
    accountsDeleted: 0,
    accountFailures: 0,
    photosCleaned: 0,
    photoFailures: 0,
  };
  const pendingDeletion = await admin
    .from("exchange_deletion_requests")
    .select("user_id")
    .is("completed_at", null)
    .order("requested_at")
    .limit(10);
  if (pendingDeletion.error) throw new Error("MAINTENANCE_DELETIONS");
  for (const request of pendingDeletion.data ?? []) {
    // Both features cascade their private author/profile content. Submitted report
    // snapshots retain only the evidence needed for an open moderation process.
    try {
      const result = await admin.auth.admin.deleteUser(request.user_id);
      if (result.error) {
        summary.accountFailures++;
        recordExchangeFailure("delete_auth", result.error.code);
      } else summary.accountsDeleted++;
    } catch {
      summary.accountFailures++;
      recordExchangeFailure("delete_auth");
    }
  }
  const garbage = await admin.rpc("exchange_photo_garbage", {});
  if (garbage.error) {
    summary.photoFailures++;
    recordExchangeFailure("photo_gc", garbage.error.code);
  }
  for (const row of garbage.data ?? []) {
    try {
      if (await removeProfilePhoto(row.path)) summary.photosCleaned++;
      else summary.photoFailures++;
    } catch {
      summary.photoFailures++;
      recordExchangeFailure("photo_gc_remove");
    }
  }

  const budget = notificationBudget(process.env.EXCHANGES_EMAIL_DAILY_BUDGET);
  if (budget === 0) return summary;
  const key = process.env.EXCHANGES_RESEND_API_KEY;
  const from = process.env.EXCHANGES_EMAIL_FROM;
  const origin = process.env.EXCHANGES_SITE_URL;
  if (!key || !from || !origin || /[\r\n]/.test(from))
    throw new Error("NOTIFICATIONS_UNCONFIGURED");
  notificationContent("activity", origin); // Validate before reserving quota.
  const claimed = await admin.rpc("exchange_claim_notifications", {
    p_limit: 10,
    p_daily_budget: budget,
  });
  if (claimed.error) throw new Error("NOTIFICATIONS_DATABASE");
  for (const row of claimed.data ?? []) {
    let accepted = false;
    let skipped = false;
    try {
      // A person may opt out or request deletion after this batch was claimed.
      const preferences = await admin
        .from("exchange_accounts")
        .select("notifications")
        .eq("user_id", row.user_id)
        .maybeSingle();
      if (preferences.error)
        recordExchangeFailure(
          "notification_preferences",
          preferences.error.code,
        );
      else if (!preferences.data?.notifications) skipped = true;
      else {
        const account = await admin.auth.admin.getUserById(row.user_id);
        if (!account.error && account.data.user.email) {
          accepted = await deliverNotification({
            key,
            from,
            email: account.data.user.email,
            token: row.token,
            kind: row.kind,
            origin,
          });
        }
      }
    } catch {
      recordExchangeFailure("notification_delivery");
    }
    const finished = await admin.rpc("exchange_finish_notification", {
      p_id: row.id,
      p_token: row.token,
      p_success: accepted,
    });
    if (finished.error) {
      summary.notificationAckFailures++;
      recordExchangeFailure("notification_finish", finished.error.code);
    }
    if (accepted) summary.notificationsAccepted++;
    else if (skipped) summary.notificationsSkipped++;
    else summary.notificationFailures++;
  }
  return summary;
}
