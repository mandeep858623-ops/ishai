import {useState, useCallback} from 'react';

/**
 * Hook to simplify connecting an AdvancedMarker instance to an InfoWindow anchor prop.
 * Returns a ref callback for the AdvancedMarker and the marker instance for the InfoWindow.
 */
export function useAdvancedMarkerRef() {
  const [marker, setMarker] =
    useState<google.maps.marker.AdvancedMarkerElement | null>(null);

  const refCallback = useCallback((m: google.maps.marker.AdvancedMarkerElement | null) => {
    setMarker(m);
  }, []);

  // Returns [ref, instance]
  return [refCallback, marker] as const;
}
