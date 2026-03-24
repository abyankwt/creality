"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    const startProgress = () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }

      setVisible(true);
      setProgress(12);

      intervalRef.current = window.setInterval(() => {
        setProgress((current) => {
          if (current >= 85) {
            return current;
          }

          return current + Math.max(4, (90 - current) / 6);
        });
      }, 140);
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link = (event.target as HTMLElement | null)?.closest("a[href]");
      if (!link) {
        return;
      }

      const href = link.getAttribute("href");
      if (!href) {
        return;
      }

      const url = new URL(href, window.location.href);
      const isSamePage =
        url.pathname === window.location.pathname &&
        url.search === window.location.search;

      if (url.origin !== window.location.origin || isSamePage) {
        return;
      }

      startProgress();
    };

    document.addEventListener("click", handleDocumentClick);

    return () => {
      mountedRef.current = false;
      document.removeEventListener("click", handleDocumentClick);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current || !visible) {
      return;
    }

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setProgress(100);
    const timeoutId = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 240);

    return () => window.clearTimeout(timeoutId);
  }, [pathname, searchParams, visible]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1">
      <div
        className={`h-full bg-[#6BBE45] transition-all duration-300 ease-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
