import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationBell() {
  const [userId, setUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then((u) => setUserId(u.id)).catch(() => {});
  }, []);

  const load = async () => {
    if (!userId) return;
    const page = await base44.entities.Notification.filter(
      { recipient_id: userId },
      { sort: "-created_date", limit: 10 }
    );
    setNotifications(page.items || []);
    const count = await base44.entities.Notification.count({ recipient_id: userId, read: false });
    setUnreadCount(count);
  };

  useEffect(() => { load(); }, [userId]);

  // Live updates: new notifications appear instantly
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = base44.entities.Notification.subscribe(() => { load(); });
    return unsubscribe;
  }, [userId]);

  const handleClick = async (n) => {
    setOpen(false);
    if (!n.read) {
      await base44.entities.Notification.update(n.id, { read: true });
      load();
    }
    if (n.link) navigate(n.link);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 border-border bg-popover">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Notifications</p>
        </div>
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <MessageSquare className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">You're all caught up.</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-secondary/40 transition-colors",
                  !n.read && "bg-primary/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-sm truncate", n.read ? "text-foreground" : "text-primary font-medium")}>
                    {n.title}
                  </p>
                  {!n.read && <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-primary mt-2" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.body}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.created_date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}