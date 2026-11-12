import {useState, useCallback} from 'react';
import {useMap, useMapsLibrary} from '@vis.gl/react-google-maps';

interface LatLngLiteral {
    lat: number;
    lng: number;
}

/**
 * Custom hook to interface with the modern Google Maps Routes Service.
 * This utilizes the client-side JS SDK wrapper (routesLib.Route.computeRoutes)
 * which safely handles requests without triggering CORS preflight issues.
 */
export function useRouteCalculator() {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const [result, setResult] = useState<google.maps.routes.Route[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computeRoute = useCallback(async (origin: LatLngLiteral, destination: LatLngLiteral, waypoints?: LatLngLiteral[]) => {
    if (!routesLib || !map) {
      setError("Routes library or map not loaded.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    const request: any = {
      origin: {lat: origin.lat, lng: origin.lng},
      destination: {lat: destination.lat, lng: destination.lng},
      intermediates: waypoints?.map(w => ({ location: { lat: w.lat, lng: w.lng } })),
      travelMode: 'DRIVING',
      routingPreference: 'TRAFFIC_AWARE',
    };

    try {
        let response: any;
        if (typeof (routesLib.Route as any)?.computeRoutes === 'function') {
          response = await (routesLib.Route as any).computeRoutes(request);
        } else if (typeof (routesLib as any)?.Route === 'function') {
          try {
            const routeService = new (routesLib as any).Route(map);
            response = await routeService.computeRoutes(request);
          } catch {
            response = await (routesLib.Route as any).computeRoutes(request);
          }
        }

        if (response?.routes && response.routes.length > 0) {
            setResult(response.routes);
        } else {
            setError("No route found.");
        }
    } catch (e: any) {
      const errStr = e instanceof Error ? e.message : String(e);
      if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('OVER_QUERY_LIMIT')) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      setError(e instanceof Error ? e.message : "Failed to compute route.");
    } finally {
      setIsLoading(false);
    }
  }, [routesLib, map]);

  return {computeRoute, result, isLoading, error, setResult};
}
