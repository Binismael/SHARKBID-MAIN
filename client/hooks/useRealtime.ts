import { useEffect, useCallback } from "react";
import {
  subscribeToNotifications,
  subscribeToProject,
  subscribeToMessages,
  subscribeToActivityFeed,
  subscribeToCreatorUpdates,
  unsubscribe,
} from "@/lib/realtime-service";

/**
 * Hook to subscribe to real-time notifications
 * Replaces polling with live updates
 *
 * Usage:
 * const notifications = useRealtimeNotifications(userId);
 */
export function useRealtimeNotifications(
  userId: string | undefined,
  onNewNotification?: (notification: any) => void
) {
  useEffect(() => {
    if (!userId) return;

    const unsubscribeFn = subscribeToNotifications(
      userId,
      (notification) => {
        onNewNotification?.(notification);
      },
      (error) => {
        console.warn("Realtime notification subscription error:", error);
      }
    );

    return () => {
      unsubscribeFn?.();
    };
  }, [userId, onNewNotification]);
}

/**
 * Hook to subscribe to real-time project updates
 *
 * Usage:
 * useRealtimeProject(projectId, (update) => {
 *   setProject(update.new);
 * });
 */
export function useRealtimeProject(
  projectId: string | undefined,
  onUpdate?: (event: any) => void
) {
  useEffect(() => {
    if (!projectId) return;

    const unsubscribeFn = subscribeToProject(
      projectId,
      (event) => {
        onUpdate?.(event);
      },
      (error) => {
        console.warn("Realtime project subscription error:", error);
      }
    );

    return () => {
      unsubscribeFn?.();
    };
  }, [projectId, onUpdate]);
}

/**
 * Hook to subscribe to real-time messages
 *
 * Usage:
 * useRealtimeMessages(conversationKey, (message) => {
 *   setMessages(prev => [...prev, message]);
 * });
 */
export function useRealtimeMessages(
  conversationKey: string | undefined,
  onNewMessage?: (message: any) => void
) {
  useEffect(() => {
    if (!conversationKey) return;

    const unsubscribeFn = subscribeToMessages(
      conversationKey,
      (message) => {
        onNewMessage?.(message);
      },
      (error) => {
        console.warn("Realtime messages subscription error:", error);
      }
    );

    return () => {
      unsubscribeFn?.();
    };
  }, [conversationKey, onNewMessage]);
}

/**
 * Hook to subscribe to real-time activity feed
 *
 * Usage:
 * useRealtimeActivityFeed(userId, (activity) => {
 *   setActivities(prev => [activity, ...prev]);
 * });
 */
export function useRealtimeActivityFeed(
  userId: string | undefined,
  onActivity?: (activity: any) => void
) {
  useEffect(() => {
    if (!userId) return;

    const unsubscribeFn = subscribeToActivityFeed(
      userId,
      (activity) => {
        onActivity?.(activity);
      },
      (error) => {
        console.warn("Realtime activity subscription error:", error);
      }
    );

    return () => {
      unsubscribeFn?.();
    };
  }, [userId, onActivity]);
}

/**
 * Hook to subscribe to real-time creator marketplace updates
 *
 * Usage:
 * useRealtimeCreators((update) => {
 *   // Update creator list
 * });
 */
export function useRealtimeCreators(
  onCreatorUpdate?: (update: any) => void
) {
  useEffect(() => {
    const unsubscribeFn = subscribeToCreatorUpdates(
      (update) => {
        onCreatorUpdate?.(update);
      },
      (error) => {
        console.warn("Realtime creator subscription error:", error);
      }
    );

    return () => {
      unsubscribeFn?.();
    };
  }, [onCreatorUpdate]);
}
