import { supabase } from "./supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

// Subscription management
const subscriptions: Map<string, RealtimeChannel> = new Map();

/**
 * Subscribe to notifications in real-time
 * Replaces polling with live updates
 */
export function subscribeToNotifications(
  userId: string,
  onNewNotification: (notification: any) => void,
  onError?: (error: any) => void
) {
  if (!userId) return;

  const channelName = `notifications:${userId}`;

  // Unsubscribe if already subscribed
  if (subscriptions.has(channelName)) {
    unsubscribe(channelName);
  }

  try {
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          onNewNotification(payload.new);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`Subscribed to notifications for ${userId}`);
        } else if (status === "CLOSED") {
          console.log("Realtime subscription closed");
        }
      });

    subscriptions.set(channelName, channel);
    return () => unsubscribe(channelName);
  } catch (error) {
    console.error("Failed to subscribe to notifications:", error);
    onError?.(error);
  }
}

/**
 * Subscribe to project updates in real-time
 */
export function subscribeToProject(
  projectId: string,
  onUpdate: (event: any) => void,
  onError?: (error: any) => void
) {
  if (!projectId) return;

  const channelName = `project:${projectId}`;

  if (subscriptions.has(channelName)) {
    unsubscribe(channelName);
  }

  try {
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all changes
          schema: "public",
          table: "projects",
          filter: `id=eq.${projectId}`,
        },
        (payload: any) => {
          onUpdate(payload);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_milestones",
          filter: `project_id=eq.${projectId}`,
        },
        (payload: any) => {
          onUpdate(payload);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deliverables",
          filter: `project_id=eq.${projectId}`,
        },
        (payload: any) => {
          onUpdate(payload);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`Subscribed to project ${projectId}`);
        }
      });

    subscriptions.set(channelName, channel);
    return () => unsubscribe(channelName);
  } catch (error) {
    console.error("Failed to subscribe to project:", error);
    onError?.(error);
  }
}

/**
 * Subscribe to messages in a conversation in real-time
 */
export function subscribeToMessages(
  conversationKey: string, // e.g., "user1-user2" or "project-123"
  onNewMessage: (message: any) => void,
  onError?: (error: any) => void
) {
  if (!conversationKey) return;

  const channelName = `messages:${conversationKey}`;

  if (subscriptions.has(channelName)) {
    unsubscribe(channelName);
  }

  try {
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload: any) => {
          onNewMessage(payload.new);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`Subscribed to messages in ${conversationKey}`);
        }
      });

    subscriptions.set(channelName, channel);
    return () => unsubscribe(channelName);
  } catch (error) {
    console.error("Failed to subscribe to messages:", error);
    onError?.(error);
  }
}

/**
 * Subscribe to activity feed in real-time
 */
export function subscribeToActivityFeed(
  userId: string,
  onActivity: (activity: any) => void,
  onError?: (error: any) => void
) {
  if (!userId) return;

  const channelName = `activity:${userId}`;

  if (subscriptions.has(channelName)) {
    unsubscribe(channelName);
  }

  try {
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_logs",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          onActivity(payload.new);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`Subscribed to activity feed for ${userId}`);
        }
      });

    subscriptions.set(channelName, channel);
    return () => unsubscribe(channelName);
  } catch (error) {
    console.error("Failed to subscribe to activity:", error);
    onError?.(error);
  }
}

/**
 * Subscribe to creator marketplace updates
 */
export function subscribeToCreatorUpdates(
  onCreatorUpdate: (update: any) => void,
  onError?: (error: any) => void
) {
  const channelName = "creators:public";

  if (subscriptions.has(channelName)) {
    unsubscribe(channelName);
  }

  try {
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "creator_profiles",
          filter: `status=eq.approved`,
        },
        (payload: any) => {
          onCreatorUpdate(payload);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Subscribed to creator marketplace updates");
        }
      });

    subscriptions.set(channelName, channel);
    return () => unsubscribe(channelName);
  } catch (error) {
    console.error("Failed to subscribe to creator updates:", error);
    onError?.(error);
  }
}

/**
 * Unsubscribe from a specific channel
 */
export function unsubscribe(channelName: string) {
  const channel = subscriptions.get(channelName);
  if (channel) {
    channel.unsubscribe();
    subscriptions.delete(channelName);
    console.log(`Unsubscribed from ${channelName}`);
  }
}

/**
 * Unsubscribe from all channels
 */
export function unsubscribeAll() {
  subscriptions.forEach((channel) => {
    channel.unsubscribe();
  });
  subscriptions.clear();
  console.log("Unsubscribed from all realtime channels");
}

/**
 * Get subscription status
 */
export function getSubscriptionStatus(channelName?: string) {
  if (channelName) {
    return subscriptions.has(channelName);
  }
  return subscriptions.size;
}
