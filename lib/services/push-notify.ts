export type PushNotification = {
  title: string;
  message: string;
  priority?: "default" | "high";
  tags?: string;
};

// Skips silently when NTFY_TOPIC is unset — push is an optional channel on
// top of email, never a hard requirement. Returns whether a notification was
// actually sent, so callers don't mistake "not configured" for "delivered".
export async function sendPushNotification(
  notification: PushNotification
): Promise<boolean> {
  const topic = process.env.NTFY_TOPIC?.trim();
  if (!topic) {
    return false;
  }

  const server = process.env.NTFY_SERVER?.trim() || "https://ntfy.sh";

  const response = await fetch(`${server}/${topic}`, {
    method: "POST",
    headers: {
      Title: notification.title,
      Priority: notification.priority ?? "default",
      ...(notification.tags ? { Tags: notification.tags } : {}),
    },
    body: notification.message,
  });

  if (!response.ok) {
    throw new Error(`ntfy responded with status ${response.status}`);
  }

  return true;
}
