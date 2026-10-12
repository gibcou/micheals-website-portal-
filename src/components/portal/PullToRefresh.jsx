import React, { useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const THRESHOLD = 70;

// Native-like pull-to-refresh for touch devices: pulling the list down past
// the threshold while at the top of the page triggers a refresh.
export default function PullToRefresh({ onRefresh, children }) {
  const startY = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (e) => {
    startY.current = window.scrollY <= 0 ? e.touches[0].clientY : null;
  };

  const onTouchMove = (e) => {
    if (startY.current === null || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    setPull(dy > 0 ? Math.min(dy * 0.4, 120) : 0);
  };

  const onTouchEnd = async () => {
    const shouldRefresh = pull >= THRESHOLD;
    startY.current = null;
    setPull(0);
    if (shouldRefresh && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh?.();
      } finally {
        setTimeout(() => setRefreshing(false), 350);
      }
    }
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: refreshing ? 44 : pull }}
      >
        <RefreshCw
          className={cn(
            "h-5 w-5 text-primary transition-transform",
            (pull >= THRESHOLD || refreshing) && "rotate-180",
            refreshing && "animate-spin"
          )}
        />
      </div>
      {children}
    </div>
  );
}