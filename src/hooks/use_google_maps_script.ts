"use client";

import { useEffect, useState } from "react";

let loadPromise: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.google?.maps?.importLibrary) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const callbackName = "__googleMapsCallback__";
    (window as unknown as Record<string, () => void>)[callbackName] = () => resolve();

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&v=weekly&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => reject(new Error("No se pudo cargar Google Maps."));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useGoogleMapsScript(apiKey: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setError(new Error("Falta configurar NEXT_PUBLIC_GOOGLE_MAPS_API_KEY."));
      return;
    }

    let isMounted = true;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (isMounted) setIsLoaded(true);
      })
      .catch((loadError: Error) => {
        if (isMounted) setError(loadError);
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  return { isLoaded, error };
}
