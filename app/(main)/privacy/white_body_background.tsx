"use client";

import { useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";

export function WhiteBodyBackground() {
  const theme = useTheme();

  useEffect(() => {
    if (theme === null) return;

    const previous = document.body.style.background;
    document.body.style.background = theme === "dark" ? "" : "#ffffff";

    return () => {
      document.body.style.background = previous;
    };
  }, [theme]);

  return null;
}
