"use client";

import { useEffect, useState } from "react";

let loadPromise: Promise<void> | null = null;

function loadMapKit(token: string, language: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.mapkit?.Map) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const callbackName = "__mapKitCallback__";
    (window as unknown as Record<string, () => void>)[callbackName] = () => resolve();

    const script = document.createElement("script");
    script.src = "https://cdn.apple-mapkit.com/mk/6/mapkit.core.js";
    script.crossOrigin = "anonymous";
    script.async = true;
    script.dataset.callback = callbackName;
    script.dataset.libraries = "map,overlays,annotations";
    script.dataset.token = token;
    script.dataset.language = language;
    script.onerror = () => reject(new Error("No se pudo cargar MapKit JS."));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useMapKitScript(token: string, language = "es-MX") {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!token) {
      setError(new Error("Falta configurar NEXT_PUBLIC_MAPKIT_TOKEN."));
      return;
    }

    let isMounted = true;

    loadMapKit(token, language)
      .then(() => {
        if (isMounted) setIsLoaded(true);
      })
      .catch((loadError: Error) => {
        if (isMounted) setError(loadError);
      });

    return () => {
      isMounted = false;
    };
  }, [token, language]);

  return { isLoaded, error };
}
