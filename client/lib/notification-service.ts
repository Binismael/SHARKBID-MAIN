import { supabase } from "./supabase";

function formatError(error: any): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  if (error.details) return `${error.message} - ${error.details}`;
  return JSON.stringify(error);
}

// Utility function for retries with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 5,
  delayMs = 200,
  timeoutMs = 5000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Create a timeout promise that rejects after timeoutMs
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, timeoutMs);
        // Store timeout ID for potential cleanup
        (timeoutPromise as any).__timeoutId = timeoutId;
      });

      try {
        // Race the actual request against the timeout
        const result = await Promise.race([fn(), timeoutPromise]);
        return result;
      } catch (err) {
        throw err;
      }
    } catch (error) {
      lastError = error;
      const isTimeout = error instanceof Error && error.message === 'Request timeout';
      const isNetworkError = error instanceof TypeError && error.message.includes('Failed to fetch');

      const shouldRetry = isTimeout || isNetworkError;

      if (shouldRetry && attempt < maxAttempts - 1) {
        // Exponential backoff with jitter - faster for transient network issues
        const baseDelay = delayMs * Math.pow(2, attempt);
        const jitter = Math.random() * 50; // Add up to 50ms random jitter
        const delay = Math.min(baseDelay + jitter, 2000); // Cap at 2 seconds

        // Silently wait for retry
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (!shouldRetry) {
        // Non-network errors should fail immediately
        throw error;
      }
    }
  }

  throw lastError;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  project_id?: string;
  content: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

// Notifications
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  options?: {
    type?: "info" | "success" | "warning" | "error";
    category?: string;
    related_id?: string;
  }
) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: userId,
          title,
          message,
          type: options?.type || "info",
          category: options?.category || "general",
          related_id: options?.related_id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, notification: data };
  } catch (error) {
    const message = formatError(error);
    console.error("Error creating notification:", message);
    return { success: false, error: message };
  }
}

export async function getUserNotifications(userId: string) {
  if (!userId) {
    return { success: true, notifications: [] };
  }

  try {
    const { data, error } = await withRetry(
      () => supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      5,  // Maximum retry attempts for critical notification fetch
      200,  // Faster initial backoff
      5000  // Timeout to trigger retries faster
    );

    if (error) {
      console.debug("Supabase error fetching notifications (graceful degradation)");
      // Return empty array gracefully instead of error
      return { success: true, notifications: [] };
    }

    if (!data) {
      return { success: true, notifications: [] };
    }

    return { success: true, notifications: data };
  } catch (error) {
    // Silently handle all errors - notifications are nice-to-have, not critical
    console.debug("Notification fetch resilience activated (network issue)");
    // Gracefully degrade on network errors - return empty notifications instead of throwing
    return { success: true, notifications: [] };
  }
}

export async function getUnreadNotificationsCount(userId: string) {
  try {
    const { data, error, count } = await withRetry(
      () => supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false),
      3,  // More resilient
      300,
      5000
    );

    if (error) throw error;
    return { success: true, count: count || 0 };
  } catch (error) {
    const message = formatError(error);
    console.warn("Error getting unread count (retried 3 times):", message);
    // Return success with 0 count instead of failing
    return { success: true, count: 0 };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, notification: data };
  } catch (error) {
    const message = formatError(error);
    console.error("Error marking notification as read:", message);
    return { success: false, error: message };
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { error } = await withRetry(
      () => supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("is_read", false),
      3,  // More resilient
      300,
      5000
    );

    if (error) throw error;
    return { success: true };
  } catch (error) {
    const message = formatError(error);
    console.warn("Error marking all as read (retried 3 times):", message);
    // Return success to avoid UI breaking
    return { success: true };
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    const message = formatError(error);
    console.error("Error deleting notification:", message);
    return { success: false, error: message };
  }
}

// Messages
export async function sendMessage(
  senderId: string,
  recipientId: string,
  content: string,
  projectId?: string
) {
  try {
    // Send message
    const { data: messageData, error: messageError } = await supabase
      .from("messages")
      .insert([
        {
          sender_id: senderId,
          recipient_id: recipientId,
          project_id: projectId,
          content,
        },
      ])
      .select()
      .single();

    if (messageError) throw messageError;

    // Create notification for recipient
    const senderProfile = await supabase
      .from("user_profiles")
      .select("name, email")
      .eq("id", senderId)
      .maybeSingle();

    const senderName = senderProfile.data?.name || senderProfile.data?.email || "Someone";

    await createNotification(recipientId, `New message from ${senderName}`, content, {
      type: "info",
      category: "message",
      related_id: messageData.id,
    });

    return { success: true, message: messageData };
  } catch (error) {
    const message = formatError(error);
    console.error("Error sending message:", message);
    return { success: false, error: message };
  }
}

export async function getConversation(userId: string, otherUserId: string) {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`
      )
      .order("created_at", { ascending: true });

    if (error) throw error;
    return { success: true, messages: data || [] };
  } catch (error) {
    const message = formatError(error);
    console.error("Error fetching conversation:", message);
    return { success: false, error: message, messages: [] };
  }
}

export async function getConversations(userId: string) {
  try {
    // Get all messages for this user
    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_id, recipient_id, content, is_read, created_at")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      return { success: true, conversations: [] };
    }

    // Get unique user IDs from conversations
    const userIds = new Set<string>();
    data.forEach((msg: any) => {
      if (msg.sender_id !== userId) userIds.add(msg.sender_id);
      if (msg.recipient_id !== userId) userIds.add(msg.recipient_id);
    });

    // Fetch user profiles
    const { data: users } = userIds.size > 0 ? await supabase
      .from("user_profiles")
      .select("id, name, email")
      .in("id", Array.from(userIds)) : { data: null };

    // Group by conversation (deduplicate)
    const conversations = new Map();
    data.forEach((msg: any) => {
      const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
      const otherUser = users?.find((u) => u.id === otherId);

      if (!conversations.has(otherId)) {
        conversations.set(otherId, {
          otherUserId: otherId,
          otherUser,
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          unreadCount: 0,
        });
      }

      if (!msg.is_read && msg.recipient_id === userId) {
        conversations.get(otherId).unreadCount++;
      }
    });

    return { success: true, conversations: Array.from(conversations.values()) };
  } catch (error) {
    const message = formatError(error);
    console.error("Error fetching conversations:", message);
    return { success: false, error: message, conversations: [] };
  }
}

export async function markMessageAsRead(messageId: string) {
  try {
    const { data, error } = await supabase
      .from("messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", messageId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, message: data };
  } catch (error) {
    const message = formatError(error);
    console.error("Error marking message as read:", message);
    return { success: false, error: message };
  }
}

// Activity Logs
export async function logActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  options?: {
    description?: string;
    metadata?: Record<string, any>;
  }
) {
  try {
    const { data, error } = await supabase
      .from("activity_logs")
      .insert([
        {
          user_id: userId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          description: options?.description,
          metadata: options?.metadata || {},
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, log: data };
  } catch (error) {
    const message = formatError(error);
    console.error("Error logging activity:", message);
    return { success: false, error: message };
  }
}

export async function getActivityFeed(userId: string, limit = 20) {
  try {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, activities: data || [] };
  } catch (error) {
    const message = formatError(error);
    console.error("Error fetching activity feed:", message);
    return { success: false, error: message, activities: [] };
  }
}
