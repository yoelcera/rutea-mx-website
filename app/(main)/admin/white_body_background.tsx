"use client";

import { useEffect } from "react";

export function WhiteBodyBackground() {
  useEffect(() => {
    const previous = document.body.style.background;
    document.body.style.background = "#ffffff";
    return () => {
      document.body.style.background = previous;
    };
  }, []);

  return null;
}
