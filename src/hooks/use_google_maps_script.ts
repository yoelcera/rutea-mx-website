"use client";

import { useEffect, useState } from "react";

let scriptLoadingPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&v=weekly&loading=async`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Google Maps."));
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
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

    loadGoogleMapsScript(apiKey)
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
