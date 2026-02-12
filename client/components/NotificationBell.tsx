import { useState, useEffect } from "react";
import { Bell, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  getUnreadNotificationsCount,
} from "@/lib/notification-service";
import { Button } from "./ui/button";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      // Load notifications immediately but don't block
      loadNotifications().catch(() => {
        // Silently ignore errors on initial load
      });

      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        loadNotifications().catch(() => {
          // Silently ignore errors on polling
        });
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;

    // Don't set loading state to avoid UI flicker
    try {
      const result = await getUserNotifications(user.id);

      if (result.success && result.notifications) {
        setNotifications(result.notifications);
        const unread = result.notifications.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      } else {
        if (result.error) {
          console.warn("Failed to load notifications:", result.error);
        }
        // Set empty notifications on error instead of keeping stale data
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      // Silently handle errors - don't block the UI or log excessively
      console.debug("Notification loading (network resilience)");
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsRead(notificationId);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleDelete = async (notificationId: string) => {
    const result = await deleteNotification(notificationId);
    if (result.success) {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-secondary/10 border-secondary/20 text-secondary";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/20 text-yellow-600";
      case "error":
        return "bg-destructive/10 border-destructive/20 text-destructive";
      default:
        return "bg-accent/10 border-accent/20 text-accent";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-2 w-2 bg-accent rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/50 transition ${
                    !notification.is_read ? "bg-muted/30" : ""
                  }`}
                  onClick={() =>
                    !notification.is_read && handleMarkAsRead(notification.id)
                  }
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                        notification.type === "success"
                          ? "bg-secondary"
                          : notification.type === "error"
                            ? "bg-destructive"
                            : "bg-accent"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-2">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      className="text-muted-foreground hover:text-destructive transition flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border">
              <button className="w-full text-xs text-accent hover:text-accent/80 font-medium">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
