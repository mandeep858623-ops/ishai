import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow, 
  useMap, 
  useMapsLibrary,
  MapCameraChangedEvent,
  MapCameraProps
} from '@vis.gl/react-google-maps';
import { 
  Search, 
  Navigation, 
  Save, 
  Map as MapIcon, 
  Layers, 
  Compass, 
  Clock, 
  Star, 
  Trash2, 
  X,
  ChevronRight,
  ChevronLeft,
  Settings,
  Maximize2,
  Minimize2,
  Zap,
  Globe,
  MapPin,
  Route,
  Navigation2,
  Bookmark,
  Sparkles,
  Info,
  Calendar,
  DollarSign,
  Users,
  Plane,
  Eye,
  Coffee,
  Utensils,
  Fuel,
  Hotel,
  Landmark,
  Hospital,
  ShoppingBag,
  Car,
  Footprints,
  Bike,
  Train,
  ArrowUpDown,
  Share2,
  Copy,
  Check,
  Crosshair,
  Camera,
  Compass as CompassIcon,
  RotateCw,
  Send,
  CheckCircle2,
  Circle,
  PhoneCall,
  Smartphone,
  Shield,
  Radio,
  AlertCircle,
  RefreshCw,
  Lock,
  ExternalLink,
  Plus,
  Minus
} from 'lucide-react';
import { mapService, MapPlace, MapTrip } from '../../services/MapService';
import { useRouteCalculator } from '../../hooks/useRouteCalculator';
import { useAutocompleteSuggestions } from '../../hooks/useAutocompleteSuggestions';
import { useAdvancedMarkerRef } from '../../hooks/useAdvancedMarkerRef';
import { streamAiCompletion } from '../../utils/aiClient';
import { RecipientConsentModal } from './RecipientConsentModal';
import { soundEngine } from '../../utils/audio';

interface MapsWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyA7YoIV4b49W9y6n629n0cRqRb8b9sjxQM';

// Country calling codes options
const CALLING_CODE_OPTIONS = [
  { code: '+1', country: 'United States & Canada', flag: '🇺🇸 / 🇨🇦' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+7', country: 'Russia / Kazakhstan', flag: '🇷🇺' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
];

// Interactive Quick Demo Numbers for AI Region Circle
export const DEMO_PRESET_NUMBERS = [
  { label: 'NYC Wire Center', flag: '🗽', code: '+1', number: '2125550199', desc: '14km Wire Center (Fixed Line)' },
  { label: 'San Francisco', flag: '🌉', code: '+1', number: '4155550143', desc: '16km Bay Area (Fixed Line)' },
  { label: 'London Central', flag: '🇬🇧', code: '+44', number: '2079460912', desc: '22km Exchange (Fixed Line)' },
  { label: 'Delhi Metro', flag: '🇮🇳', code: '+91', number: '1123456789', desc: '28km NCR Metro (Fixed Line)' },
  { label: 'Tokyo Kanto', flag: '🗼', code: '+81', number: '335803311', desc: '20km Metro Area (Fixed Line)' },
  { label: 'India Cellular', flag: '📱', code: '+91', number: '9876543210', desc: 'Nationwide Mobile (950km)' },
];

export const RADIUS_PRESET_OPTIONS = [5, 15, 25, 50, 100];

// Quick Category Search List
const QUICK_CATEGORIES = [
  { id: 'cafes', label: 'Cafes', icon: Coffee, query: 'coffee cafes near me' },
  { id: 'restaurants', label: 'Restaurants', icon: Utensils, query: 'top rated restaurants' },
  { id: 'gas', label: 'Gas Stations', icon: Fuel, query: 'gas stations near me' },
  { id: 'hotels', label: 'Hotels', icon: Hotel, query: 'luxury hotels and resorts' },
  { id: 'attractions', label: 'Attractions', icon: Landmark, query: 'tourist attractions and sights' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, query: 'shopping malls' },
  { id: 'hospitals', label: 'Hospitals', icon: Hospital, query: 'hospitals emergency' }
];

// Curated World Explorer Featured Destinations
const WORLD_WONDERS = [
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, zoom: 14, tag: 'Cyber Metropolis', desc: 'Futuristic skyscrapers, Shibuya Crossing, historic Senso-ji temple.', capital: 'Tokyo', currency: 'JPY (¥)', language: 'Japanese' },
  { id: 'paris', name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, zoom: 14, tag: 'City of Light', desc: 'Eiffel Tower, Louvre Museum, Avenue des Champs-Élysées, Notre-Dame.', capital: 'Paris', currency: 'EUR (€)', language: 'French' },
  { id: 'rome', name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964, zoom: 14, tag: 'The Eternal City', desc: 'The Colosseum, Pantheon, Roman Forum, and Vatican City.', capital: 'Rome', currency: 'EUR (€)', language: 'Italian' },
  { id: 'newyork', name: 'New York City', country: 'USA', lat: 40.7128, lng: -74.0060, zoom: 13, tag: 'The Big Apple', desc: 'Times Square, Central Park, Manhattan Skyline, Empire State.', capital: 'Washington D.C.', currency: 'USD ($)', language: 'English' },
  { id: 'cairo', name: 'Cairo & Pyramids', country: 'Egypt', lat: 29.9792, lng: 31.1342, zoom: 14, tag: 'Ancient Wonder', desc: 'The Great Pyramid of Giza, Sphinx, Nile River cruises.', capital: 'Cairo', currency: 'EGP (E£)', language: 'Arabic' },
  { id: 'dubai', name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, zoom: 14, tag: 'Futuristic Oasis', desc: 'Burj Khalifa, Dubai Mall, Palm Jumeirah, and Desert Safaris.', capital: 'Abu Dhabi', currency: 'AED', language: 'Arabic / English' },
  { id: 'london', name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278, zoom: 13, tag: 'Crown & Culture', desc: 'Big Ben, Westminster Abbey, Tower Bridge, Buckingham Palace.', capital: 'London', currency: 'GBP (£)', language: 'English' },
  { id: 'sydney', name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, zoom: 14, tag: 'Harbour Jewel', desc: 'Sydney Opera House, Sydney Harbour Bridge, Bondi Beach.', capital: 'Canberra', currency: 'AUD (A$)', language: 'English' },
  { id: 'rio', name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lng: -43.1729, zoom: 13, tag: 'Marvelous City', desc: 'Christ the Redeemer, Copacabana Beach, Sugarloaf Mountain.', capital: 'Brasília', currency: 'BRL (R$)', language: 'Portuguese' },
  { id: 'tajmahal', name: 'Taj Mahal (Agra)', country: 'India', lat: 27.1751, lng: 78.0421, zoom: 15, tag: 'Ivory Monument', desc: 'UNESCO World Heritage ivory-white marble mausoleum on the Yamuna.', capital: 'New Delhi', currency: 'INR (₹)', language: 'Hindi / English' },
  { id: 'machupicchu', name: 'Machu Picchu', country: 'Peru', lat: -13.1631, lng: -72.5450, zoom: 15, tag: 'Inca Citadel', desc: '15th-century Inca citadel situated on a mountain ridge 2,430m above sea level.', capital: 'Lima', currency: 'PEN (S/)', language: 'Spanish / Quechua' },
  { id: 'reykjavik', name: 'Reykjavik & Aurora', country: 'Iceland', lat: 64.1466, lng: -21.9426, zoom: 12, tag: 'Land of Fire & Ice', desc: 'Geysers, volcanic hot springs, glaciers, and breathtaking Northern Lights.', capital: 'Reykjavik', currency: 'ISK (kr)', language: 'Icelandic' },
];

export const MapsWorkspaceModal: React.FC<MapsWorkspaceModalProps> = ({ isOpen, onClose, currentUser }) => {
  if (!isOpen) return null;

  return (
    <APIProvider 
      apiKey={API_KEY} 
      libraries={['places', 'geometry', 'routes', 'marker', 'maps', 'streetView']}
    >
      <MapsContent isOpen={isOpen} onClose={onClose} currentUser={currentUser} />
    </APIProvider>
  );
};

const MapsContent: React.FC<MapsWorkspaceModalProps> = ({ isOpen, onClose, currentUser }) => {
  // Navigation & Workspace Tabs
  const [activeTab, setActiveTab] = useState<'search' | 'number_finder' | 'directions' | 'trips' | 'world' | 'saved'>('search');
  
  // Search & Places State
  const [searchQuery, setSearchQuery] = useState('');
  const [savedPlaces, setSavedPlaces] = useState<MapPlace[]>([]);
  const [trips, setTrips] = useState<MapTrip[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.Place | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Directions State
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'TRANSIT' | 'WALKING' | 'BICYCLING'>('DRIVING');
  const [isNavigating, setIsNavigating] = useState(false);

  // Map Camera & Display State
  const [cameraProps, setCameraProps] = useState<MapCameraProps>({
    center: { lat: 40.7128, lng: -74.0060 }, // NYC default
    zoom: 13,
    heading: 0,
    tilt: 0
  });
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [mapId, setMapId] = useState<string>('DEMO_MAP_ID');
  const [isTrafficActive, setIsTrafficActive] = useState(false);
  const [isStreetViewActive, setIsStreetViewActive] = useState(false);
  const [streetViewPosition, setStreetViewPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Geolocation State
  const [currentGpsLocation, setCurrentGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // UI Panels
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // =========================================================================
  // AI NUMBER REGION CIRCLE & LIVE LOCATION STATE
  // =========================================================================
  const [countryCallingCode, setCountryCallingCode] = useState('+1');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [numberLookupData, setNumberLookupData] = useState<any | null>(null);
  const [isLookingUpNumber, setIsLookingUpNumber] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // AI Number Region Circle Geographic State
  const [numberRegionCircle, setNumberRegionCircle] = useState<{
    center: { lat: number; lng: number };
    radiusMeters: number;
    sourceRadiusMeters: number;
    regionName: string;
    precision: 'METRO_AREA' | 'STATE_PROVINCE' | 'COUNTRY_LEVEL' | 'NONE';
    dataSource: string;
    confidence: string;
    limitations: string;
    isManualAdjustment: boolean;
    isVisible: boolean;
  } | null>(null);

  // Live Location Request State
  const [requesterName, setRequesterName] = useState(currentUser?.displayName || 'SUPERAI Maps Explorer');
  const [requestPurpose, setRequestPurpose] = useState('Personal Safety & Coordination');
  const [requestDurationMinutes, setRequestDurationMinutes] = useState(60);
  const [isSendingLocationRequest, setIsSendingLocationRequest] = useState(false);
  const [locationRequestResult, setLocationRequestResult] = useState<any | null>(null);
  const [locationRequestError, setLocationRequestError] = useState<string | null>(null);

  // Active Live Location Sessions (sessions requested by this user)
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [selectedSessionForMap, setSelectedSessionForMap] = useState<any | null>(null);
  const [autoFollowRecipient, setAutoFollowRecipient] = useState(true);

  // In-app Recipient Consent Tester modal state
  const [testerInviteToken, setTesterInviteToken] = useState<string | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  // AI Trip Genie State
  const [tripDestination, setTripDestination] = useState('');
  const [tripDuration, setTripDuration] = useState('3-Day Weekend');
  const [tripTravelers, setTripTravelers] = useState('Couple');
  const [tripStyle, setTripStyle] = useState('Culture & Sights');
  const [tripOutput, setTripOutput] = useState('');
  const [isGeneratingTrip, setIsGeneratingTrip] = useState(false);
  const tripAbortController = useRef<AbortController | null>(null);

  // World Explorer Checklist State (Persisted in LocalStorage)
  const [visitedWonders, setVisitedWonders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('superai_visited_wonders');
      return saved ? JSON.parse(saved) : ['newyork'];
    } catch {
      return ['newyork'];
    }
  });

  const map = useMap();
  const placesLib = useMapsLibrary('places');

  const { suggestions, resetSession } = useAutocompleteSuggestions(searchQuery);
  const { computeRoute, result: routeResult, isLoading: isRouteLoading, error: routeError, setResult: setRouteResult } = useRouteCalculator();
  const [markerRef, marker] = useAdvancedMarkerRef();

  // Tier 1 Quota Handler Listener
  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  // Load Saved Data from Firestore on open
  useEffect(() => {
    if (isOpen) {
      loadData();
      detectCurrentLocation(false);
      fetchMySessions();
    }
  }, [isOpen]);

  // Periodic polling for active location sharing sessions
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      fetchMySessions();
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, autoFollowRecipient]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const places = await mapService.getSavedPlaces();
      const userTrips = await mapService.getTrips();
      setSavedPlaces(places);
      setTrips(userTrips);
    } catch (error) {
      console.error('Error loading map records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMySessions = async () => {
    try {
      const res = await fetch(`/api/location-share/my-sessions?requesterId=${currentUser?.uid || 'guest_user'}`);
      if (res.ok) {
        const data = await res.json();
        setActiveSessions(data.sessions || []);

        // If an active session is currently streaming coordinates, auto-center or track
        const live = data.sessions?.find((s: any) => s.status === 'SHARING_ACTIVE' && s.lastCoordinates);
        if (live) {
          if (!selectedSessionForMap) {
            setSelectedSessionForMap(live);
          }
          if (autoFollowRecipient && live.lastCoordinates) {
            setCameraProps(prev => ({
              ...prev,
              center: { lat: live.lastCoordinates.lat, lng: live.lastCoordinates.lng }
            }));
          }
        }
      }
    } catch (e) {
      // Quiet background polling
    }
  };

  // Detect User GPS Coordinates
  const detectCurrentLocation = (panMap = true) => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentGpsLocation(coords);
        setIsLocating(false);
        if (panMap) {
          setCameraProps(prev => ({
            ...prev,
            center: coords,
            zoom: 15
          }));
        }
      },
      (err) => {
        console.warn('Geolocation unavailable:', err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Camera Changed
  const handleCameraChange = useCallback((ev: MapCameraChangedEvent) => {
    setCameraProps(ev.detail);
  }, []);

  // Handle Autocomplete Place Selection
  const handleSuggestionClick = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    if (!placesLib || !suggestion.placePrediction) return;
    setIsLoading(true);
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['location', 'displayName', 'formattedAddress', 'viewport', 'photos', 'rating', 'userRatingCount', 'priceLevel', 'types']
      });
      setSelectedPlace(place);
      if (place.location) {
        const coords = { lat: place.location.lat(), lng: place.location.lng() };
        setCameraProps(prev => ({
          ...prev,
          center: coords,
          zoom: 16
        }));
        setStreetViewPosition(coords);
      }
      setSearchQuery('');
      resetSession();
    } catch (error) {
      console.error('Error fetching place details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search by Text query (e.g. from category click)
  const handleTextSearch = async (queryText: string) => {
    if (!placesLib || !queryText) return;
    setIsLoading(true);
    try {
      if (typeof (placesLib.Place as any)?.searchByText === 'function') {
        const center = cameraProps.center as { lat: number; lng: number };
        const res = await (placesLib.Place as any).searchByText({
          textQuery: queryText,
          fields: ['location', 'displayName', 'formattedAddress', 'rating', 'userRatingCount', 'priceLevel'],
          locationBias: center ? { lat: center.lat, lng: center.lng } : undefined,
          maxResultCount: 8
        });

        if (res.places && res.places.length > 0) {
          const first = res.places[0];
          setSelectedPlace(first);
          if (first.location) {
            setCameraProps(prev => ({
              ...prev,
              center: { lat: first.location.lat(), lng: first.location.lng() },
              zoom: 15
            }));
          }
        }
      } else {
        setSearchQuery(queryText);
      }
    } catch (err: any) {
      const errStr = String(err);
      if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('OVER_QUERY_LIMIT')) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save Place to Firestore
  const handleSavePlace = async (place: google.maps.places.Place) => {
    if (!place.location || !place.displayName) return;
    try {
      const newPlace = await mapService.savePlace({
        name: place.displayName,
        address: place.formattedAddress || '',
        lat: place.location.lat(),
        lng: place.location.lng(),
        category: 'Favorite Place'
      });
      setSavedPlaces(prev => [newPlace, ...prev]);
    } catch (error) {
      console.error('Save place error:', error);
    }
  };

  // Handle Directions Request
  const handleCalculateDirections = async () => {
    let originCoords: { lat: number; lng: number } | null = null;
    let destCoords: { lat: number; lng: number } | null = null;

    if (originInput.toLowerCase().includes('current') || originInput.toLowerCase().includes('my location')) {
      originCoords = currentGpsLocation || (cameraProps.center as { lat: number; lng: number });
    }

    if (selectedPlace?.location) {
      destCoords = { lat: selectedPlace.location.lat(), lng: selectedPlace.location.lng() };
    }

    if (!originCoords) {
      originCoords = cameraProps.center as { lat: number; lng: number };
    }

    if (originCoords && destCoords) {
      await computeRoute(originCoords, destCoords);
      setIsNavigating(true);
    }
  };

  // Launch Navigation to Selected Place
  const handleNavigateToPlace = (place: google.maps.places.Place) => {
    if (!place.location) return;
    const dest = { lat: place.location.lat(), lng: place.location.lng() };
    const origin = currentGpsLocation || (cameraProps.center as { lat: number; lng: number });
    setDestinationInput(place.displayName || 'Selected Place');
    setOriginInput('Current Location');
    computeRoute(origin, dest);
    setActiveTab('directions');
    setIsNavigating(true);
  };

  // =========================================================================
  // AI NUMBER REGION CIRCLE & LIVE LOCATION ACTIONS
  // =========================================================================
  const handleLookupNumber = async (overrideCode?: string, overrideNumber?: string) => {
    const code = overrideCode || countryCallingCode;
    const digits = (overrideNumber !== undefined ? overrideNumber : phoneDigits).trim();

    if (!digits) {
      setLookupError('Please enter the phone number digits.');
      return;
    }
    setIsLookingUpNumber(true);
    setLookupError(null);
    setNumberLookupData(null);
    setNumberRegionCircle(null);

    try {
      const res = await fetch('/api/location-share/lookup-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: code,
          nationalNumber: digits,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.valid === false) {
        soundEngine.playAlertBeep();
        setLookupError(data.error || 'Invalid phone number or dialing code format.');
        setNumberLookupData(data.valid === false ? data : null);
        return;
      }
      soundEngine.playSuccess();
      setNumberLookupData(data);

      if (data.geographicEstimate && data.geographicEstimate.hasGeographicRegion && data.geographicEstimate.center) {
        const est = data.geographicEstimate;
        setNumberRegionCircle({
          center: est.center,
          radiusMeters: est.estimatedRadiusMeters,
          sourceRadiusMeters: est.estimatedRadiusMeters,
          regionName: est.regionName,
          precision: est.precision,
          dataSource: est.dataSource,
          confidence: est.confidence,
          limitations: est.limitations,
          isManualAdjustment: false,
          isVisible: true,
        });

        // Auto center map on region circle
        setCameraProps({
          center: est.center,
          zoom: est.precision === 'METRO_AREA' ? 12 : (est.precision === 'STATE_PROVINCE' ? 8 : 5),
          heading: 0,
          tilt: 0,
        });
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      setLookupError(err.message || 'Lookup failed.');
    } finally {
      setIsLookingUpNumber(false);
    }
  };

  const handleSelectDemoPreset = (preset: typeof DEMO_PRESET_NUMBERS[0]) => {
    soundEngine.playClick();
    setCountryCallingCode(preset.code);
    setPhoneDigits(preset.number);
    handleLookupNumber(preset.code, preset.number);
  };

  const handleZoomIn = () => {
    soundEngine.playClick();
    setCameraProps(prev => ({ ...prev, zoom: Math.min((prev.zoom || 13) + 1, 21) }));
  };

  const handleZoomOut = () => {
    soundEngine.playClick();
    setCameraProps(prev => ({ ...prev, zoom: Math.max((prev.zoom || 13) - 1, 2) }));
  };

  const handleResetNorth = () => {
    soundEngine.playClick();
    setCameraProps(prev => ({ ...prev, heading: 0 }));
  };

  const handleToggleFullscreen = () => {
    soundEngine.playClick();
    if (!document.fullscreenElement) {
      modalContainerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleAdjustRadius = (newRadiusKm: number) => {
    soundEngine.playClick();
    if (!numberRegionCircle) return;
    const newMeters = Math.round(newRadiusKm * 1000);
    const isManual = Math.abs(newMeters - numberRegionCircle.sourceRadiusMeters) > 500;
    setNumberRegionCircle(prev => prev ? ({
      ...prev,
      radiusMeters: newMeters,
      isManualAdjustment: isManual,
    }) : null);
  };

  const handleResetRadiusToSource = () => {
    if (!numberRegionCircle) return;
    setNumberRegionCircle(prev => prev ? ({
      ...prev,
      radiusMeters: prev.sourceRadiusMeters,
      isManualAdjustment: false,
    }) : null);
  };

  const handleFlyToRegionCircle = () => {
    if (!numberRegionCircle) return;
    setCameraProps({
      center: numberRegionCircle.center,
      zoom: numberRegionCircle.precision === 'METRO_AREA' ? 12 : (numberRegionCircle.precision === 'STATE_PROVINCE' ? 8 : 5),
      heading: 0,
      tilt: 0,
    });
  };

  const handleToggleRegionCircleVisibility = () => {
    if (!numberRegionCircle) return;
    setNumberRegionCircle(prev => prev ? ({ ...prev, isVisible: !prev.isVisible }) : null);
  };

  const handleRequestLiveLocation = async () => {
    if (!phoneDigits.trim()) {
      setLocationRequestError('Please enter a phone number first.');
      return;
    }
    setIsSendingLocationRequest(true);
    setLocationRequestError(null);
    setLocationRequestResult(null);

    try {
      const res = await fetch('/api/location-share/create-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: countryCallingCode,
          nationalNumber: phoneDigits,
          requesterName: requesterName || 'SUPERAI Maps Explorer',
          requesterId: currentUser?.uid || 'guest_user',
          purpose: requestPurpose || 'Personal Safety & Coordination',
          durationMinutes: requestDurationMinutes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate location request invitation.');
      }

      soundEngine.playSuccess();
      setLocationRequestResult(data);
      fetchMySessions();
    } catch (err: any) {
      soundEngine.playAlertBeep();
      setLocationRequestError(err.message || 'Failed to request live location.');
    } finally {
      setIsSendingLocationRequest(false);
    }
  };

  const handleStopSession = async (token: string) => {
    soundEngine.playAlertBeep();
    try {
      await fetch('/api/location-share/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      fetchMySessions();
      if (selectedSessionForMap?.token === token) {
        setSelectedSessionForMap(null);
      }
    } catch (e) {
      console.warn('Error stopping session:', e);
    }
  };

  const handleFlyToLiveSession = (session: any) => {
    if (session.lastCoordinates) {
      setCameraProps({
        center: { lat: session.lastCoordinates.lat, lng: session.lastCoordinates.lng },
        zoom: 16,
        heading: 0,
        tilt: 0
      });
      setSelectedSessionForMap(session);
    }
  };

  // Fly to World Wonder
  const handleFlyToWonder = (wonder: typeof WORLD_WONDERS[0]) => {
    setCameraProps({
      center: { lat: wonder.lat, lng: wonder.lng },
      zoom: wonder.zoom,
      heading: 25,
      tilt: 45
    });
    setStreetViewPosition({ lat: wonder.lat, lng: wonder.lng });
  };

  // Toggle Wonder in Checklist
  const toggleWonderVisited = (id: string) => {
    const updated = visitedWonders.includes(id)
      ? visitedWonders.filter(w => w !== id)
      : [...visitedWonders, id];
    setVisitedWonders(updated);
    try {
      localStorage.setItem('superai_visited_wonders', JSON.stringify(updated));
    } catch {}
  };

  // Generate AI Trip
  const handleGenerateTrip = () => {
    if (!tripDestination.trim() || isGeneratingTrip) return;
    setIsGeneratingTrip(true);
    setTripOutput('');

    const prompt = `You are the SUPERAI Trip Genie, an elite travel architect. Create a realistic, highly engaging day-by-day itinerary for:
- Destination: ${tripDestination}
- Duration: ${tripDuration}
- Travelers: ${tripTravelers}
- Style: ${tripStyle}

Provide:
1. Trip Overview & Best Times to Visit
2. Day-by-Day Detailed Schedule with Morning, Afternoon, Evening activities & specific landmark coordinates where possible
3. Recommended Local Foods & Dining Spots
4. Estimated Budget Breakdown (Accommodation, Food, Transit, Activities)
5. Essential Travel Tips (Transport, Customs, Hidden Gems)

Format with clean headers and bullet points.`;

    tripAbortController.current = streamAiCompletion(
      {
        prompt,
        systemInstruction: "You are the world's most intelligent geospatial and travel AI advisor. You give vivid, precise, well-formatted itineraries."
      },
      {
        onChunk: (chunk) => setTripOutput(prev => prev + chunk),
        onDone: () => setIsGeneratingTrip(false),
        onError: (err) => {
          setTripOutput(prev => prev + `\n\n[Intelligence Stream Error: ${err}]`);
          setIsGeneratingTrip(false);
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-2 md:p-5 select-none font-sans">
      <div 
        ref={modalContainerRef}
        className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full h-full flex flex-col overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)] relative text-zinc-100"
      >
        
        {/* Tier 2 Quota Exceeded Sticky Notice Banner */}
        {quotaExceeded && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 px-4 py-2 text-xs md:text-sm text-center sticky top-0 z-[2001] shadow-sm animate-in slide-in-from-top duration-300">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-200 hover:text-white"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}

        {/* Master Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md z-[30]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <MapIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent font-extrabold text-sm md:text-base tracking-wider uppercase">
                  SUPERAI MAPS
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold">
                  PRO STUDIO
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-2">
                <span>Lat: {cameraProps.center ? Number(cameraProps.center.lat).toFixed(4) : '0.0000'}</span>
                <span>·</span>
                <span>Lng: {cameraProps.center ? Number(cameraProps.center.lng).toFixed(4) : '0.0000'}</span>
                <span>·</span>
                <span>Zoom: {Math.round(cameraProps.zoom || 13)}x</span>
              </p>
            </div>
          </div>

          {/* Quick Tab Switcher */}
          <div className="hidden lg:flex items-center bg-zinc-900/90 border border-zinc-800 rounded-2xl p-1 gap-1 shadow-inner">
            {[
              { id: 'search', label: 'Explore & Search', icon: Search },
              { id: 'number_finder', label: 'AI Number Region Circle', icon: Smartphone },
              { id: 'directions', label: 'Routes & GPS', icon: Route },
              { id: 'trips', label: 'AI Trip Genie', icon: Sparkles },
              { id: 'world', label: 'World Explorer', icon: Globe },
              { id: 'saved', label: 'Saved Places', icon: Bookmark },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => detectCurrentLocation(true)}
              className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                isLocating
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 animate-pulse'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
              }`}
              title="Locate My Position via GPS"
            >
              <Crosshair className={`w-4 h-4 text-emerald-400 ${isLocating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">GPS ME</span>
            </button>

            <button
              onClick={handleToggleFullscreen}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-colors text-zinc-300 hover:text-white cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-colors text-zinc-400 hover:text-white cursor-pointer"
              title="Close Maps"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Quick Chips Bar */}
        <div className="bg-zinc-950/90 border-b border-zinc-800/80 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar z-[20]">
          <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase shrink-0">DISCOVER:</span>
          {QUICK_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveTab('search');
                  handleTextSearch(cat.query);
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 text-zinc-300 hover:text-white text-[11px] whitespace-nowrap transition-all shadow-sm cursor-pointer"
              >
                <Icon className="w-3 h-3 text-emerald-400" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content: Sidebar + Interactive Map */}
        <div className="flex-1 flex relative overflow-hidden">
          
          {/* Collapsible Sidebar */}
          <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-80 md:w-96' : 'w-0'} flex flex-col bg-zinc-950/98 border-r border-zinc-800/80 overflow-hidden z-[20] shadow-2xl`}>
            
            {/* Mobile Tab Navigation */}
            <div className="flex lg:hidden border-b border-zinc-800 bg-zinc-950/90 overflow-x-auto no-scrollbar">
              {[
                { id: 'search', icon: Search, label: 'Search' },
                { id: 'number_finder', icon: Smartphone, label: 'Region Circle' },
                { id: 'directions', icon: Route, label: 'Route' },
                { id: 'trips', icon: Sparkles, label: 'Trip AI' },
                { id: 'world', icon: Globe, label: 'World' },
                { id: 'saved', icon: Bookmark, label: 'Saved' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 min-w-[65px] flex flex-col items-center py-2.5 text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/10'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mb-0.5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Sidebar Tab Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
              
              {/* ========================================================================= */}
              {/* TAB: NUMBER LOCATION FINDER */}
              {/* ========================================================================= */}
              {activeTab === 'number_finder' && (
                <div className="space-y-4">
                  
                  {/* Module Header & Legal Banner */}
                  <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-zinc-100 font-extrabold text-xs uppercase tracking-wider">
                          AI Number Region Circle
                        </h3>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          Visual Geographic Inferred Circle &amp; Consented Live GPS
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 text-[10px] text-zinc-400 font-mono leading-relaxed">
                      <span className="text-amber-400 font-bold block mb-0.5">⚠️ Privacy-First Architecture:</span>
                      Phone number lookup returns legitimate telecom numbering metadata and region allocation only. Live physical GPS location strictly requires the recipient's explicit consent via secure invitation.
                    </div>
                  </div>

                  {/* 1. Phone Number Region & Geographic Circle Lookup */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-300 font-bold flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                      <span>1. Phone Number &amp; AI Region Circle</span>
                    </span>

                    <div className="space-y-2.5">
                      {/* Quick Sample Networks Carousel */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold">
                            Quick Sample Networks:
                          </label>
                          <span className="text-[9px] text-zinc-500 font-mono">1-click test</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {DEMO_PRESET_NUMBERS.map(preset => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => handleSelectDemoPreset(preset)}
                              className="text-left p-2 rounded-xl bg-zinc-950/70 hover:bg-zinc-900 border border-zinc-800/80 hover:border-amber-500/50 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 group-hover:text-amber-300">
                                <span>{preset.flag}</span>
                                <span className="truncate">{preset.label}</span>
                              </div>
                              <div className="text-[9px] text-zinc-500 font-mono truncate mt-0.5">
                                {preset.desc}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Country Calling Code Selector */}
                      <div>
                        <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold block mb-1">
                          Country Calling Code
                        </label>
                        <select
                          value={countryCallingCode}
                          onChange={(e) => setCountryCallingCode(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl p-2.5 text-xs text-zinc-200 font-mono focus:outline-none transition-colors"
                        >
                          {CALLING_CODE_OPTIONS.map(opt => (
                            <option key={opt.code} value={opt.code}>
                              {opt.flag} {opt.code} — {opt.country}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Phone Digits Input */}
                      <div>
                        <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold block mb-1">
                          National Number Digits
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={phoneDigits}
                            onChange={(e) => setPhoneDigits(e.target.value)}
                            placeholder="e.g. 2125550199 or 9876543210"
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl py-2.5 pl-3 pr-8 text-xs text-zinc-100 placeholder:text-zinc-600 font-mono focus:outline-none transition-colors"
                            onKeyDown={(e) => e.key === 'Enter' && handleLookupNumber()}
                          />
                          {phoneDigits && (
                            <button
                              onClick={() => { setPhoneDigits(''); setNumberLookupData(null); setNumberRegionCircle(null); }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleLookupNumber()}
                        disabled={isLookingUpNumber || !phoneDigits.trim()}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                      >
                        {isLookingUpNumber ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            <span>Plotting Region Circle...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Lookup &amp; Draw Region Circle</span>
                          </>
                        )}
                      </button>

                      {lookupError && (
                        <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-3 text-[11px] text-rose-300 font-mono">
                          {lookupError}
                        </div>
                      )}
                    </div>

                    {/* Metadata Result Display */}
                    {numberLookupData && (
                      <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 space-y-2.5 mt-2 animate-in fade-in">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                          <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">
                            Numbering Allocation
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono font-bold">
                            {numberLookupData.iso}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs font-mono">
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Country:</span>
                            <span className="text-zinc-200 font-bold">{numberLookupData.country}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Format:</span>
                            <span className="text-amber-400 font-bold">{numberLookupData.e164Format}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">National:</span>
                            <span className="text-zinc-200">{numberLookupData.nationalFormat}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Type:</span>
                            <span className="text-zinc-200">{numberLookupData.numberType}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-zinc-500 shrink-0">Region / Area:</span>
                            <span className="text-zinc-100 font-bold text-right ml-2">{numberLookupData.regionOrCity}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-zinc-500 shrink-0">Carrier Network:</span>
                            <span className="text-zinc-300 text-right ml-2">{numberLookupData.carrierOrNetwork}</span>
                          </div>
                        </div>

                        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5 text-[10px] text-zinc-400 font-mono italic leading-tight">
                          {numberLookupData.disclaimer}
                        </div>
                      </div>
                    )}

                    {/* AI Geographic Region Circle Card & Explorer Controls */}
                    {numberRegionCircle && (
                      <div className="bg-amber-950/15 border border-amber-500/40 rounded-2xl p-4 space-y-3 mt-2 animate-in fade-in">
                        <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                              <Radio className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h4 className="text-amber-300 text-xs font-extrabold uppercase tracking-wide">
                                AI Number Region Circle
                              </h4>
                              <span className="text-[9px] text-zinc-400 font-mono">
                                {numberRegionCircle.precision === 'METRO_AREA'
                                  ? 'Metropolitan Exchange Allocation'
                                  : 'Country-Level National Allocation'}
                              </span>
                            </div>
                          </div>
                          <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            numberRegionCircle.confidence === 'HIGH'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {numberRegionCircle.confidence}
                          </span>
                        </div>

                        {/* Region & Coordinate Specs */}
                        <div className="space-y-1.5 text-xs font-mono">
                          <div className="flex justify-between items-start">
                            <span className="text-zinc-500 shrink-0">Inferred Region:</span>
                            <span className="text-amber-200 font-bold text-right ml-2">{numberRegionCircle.regionName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Center Coordinates:</span>
                            <span className="text-zinc-300">{numberRegionCircle.center.lat.toFixed(4)}, {numberRegionCircle.center.lng.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-zinc-500 shrink-0">Source Authority:</span>
                            <span className="text-amber-400 text-right text-[10px] ml-2">{numberRegionCircle.dataSource}</span>
                          </div>
                        </div>

                        {/* Interactive Radius Explorer Slider */}
                        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-zinc-300 flex items-center gap-1.5">
                              <Circle className="w-3 h-3 text-amber-400" />
                              <span>Adjustable Radius Explorer</span>
                            </span>
                            <span className="text-amber-300 font-mono text-xs font-bold">
                              {(numberRegionCircle.radiusMeters / 1000).toFixed(1)} km
                              <span className="text-zinc-500 text-[10px] ml-1">
                                ({((numberRegionCircle.radiusMeters / 1000) * 0.621371).toFixed(1)} mi)
                              </span>
                            </span>
                          </div>

                          <input
                            type="range"
                            min={Math.max(2, Math.round(numberRegionCircle.sourceRadiusMeters / 4000))}
                            max={Math.max(100, Math.round((numberRegionCircle.sourceRadiusMeters * 2.5) / 1000))}
                            step={1}
                            value={Math.round(numberRegionCircle.radiusMeters / 1000)}
                            onChange={(e) => handleAdjustRadius(Number(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />

                          {/* Quick Radius Preset Pills */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-[9px] text-zinc-500 font-mono shrink-0">Presets:</span>
                            {RADIUS_PRESET_OPTIONS.map(km => (
                              <button
                                key={km}
                                type="button"
                                onClick={() => handleAdjustRadius(km)}
                                className="px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 text-[9px] font-mono font-bold text-amber-300 transition-all cursor-pointer"
                              >
                                {km}km
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={handleResetRadiusToSource}
                              className="ml-auto text-[9px] text-zinc-400 hover:text-white underline font-mono cursor-pointer"
                            >
                              Reset
                            </button>
                          </div>

                          {/* Distinction Badge: Manual Adjustment vs Source-Derived Estimate */}
                          <div className="flex items-center justify-between pt-1">
                            {numberRegionCircle.isManualAdjustment ? (
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                                  Visual Exploration (Manually Adjusted)
                                </span>
                                <button
                                  onClick={handleResetRadiusToSource}
                                  className="text-[9px] text-amber-400 hover:text-amber-200 underline font-bold cursor-pointer"
                                >
                                  Reset to Source ({(numberRegionCircle.sourceRadiusMeters / 1000).toFixed(0)}km)
                                </button>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                                ✓ Source-Derived Estimate ({(numberRegionCircle.sourceRadiusMeters / 1000).toFixed(0)}km)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Limitations & Legal Notice */}
                        <div className="bg-zinc-950/80 border border-amber-900/40 rounded-xl p-3 text-[9.5px] text-amber-300/80 font-mono leading-tight space-y-1">
                          <div className="font-bold text-amber-400 flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-amber-400" />
                            <span>Inferred Telecom Allocation (Not Real-Time GPS)</span>
                          </div>
                          <p>{numberRegionCircle.limitations}</p>
                        </div>

                        {/* Circle Quick Actions */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={handleFlyToRegionCircle}
                            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                            <span>Focus on Circle</span>
                          </button>

                          <button
                            onClick={handleToggleRegionCircleVisibility}
                            className={`border py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              numberRegionCircle.isVisible
                                ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                                : 'bg-black/60 border-zinc-800 text-zinc-500 hover:text-white'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{numberRegionCircle.isVisible ? 'Hide Circle' : 'Show Circle'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Request Live Location (Consent-Based) */}
                  <div className="bg-zinc-900/60 border border-cyan-500/30 rounded-2xl p-4 space-y-3.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 font-extrabold flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      <span>2. Request Live Location</span>
                    </span>

                    <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                      Send a secure HTTPS invitation via SMS (or direct link) requesting real-time GPS consent from the recipient.
                    </p>

                    <div className="space-y-2.5 text-xs font-mono">
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                          Your Requester Name
                        </label>
                        <input
                          type="text"
                          value={requesterName}
                          onChange={(e) => setRequesterName(e.target.value)}
                          placeholder="Your Name (visible to recipient)"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-cyan-400 transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                            Sharing Duration
                          </label>
                          <select
                            value={requestDurationMinutes}
                            onChange={(e) => setRequestDurationMinutes(Number(e.target.value))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-400"
                          >
                            <option value={15}>15 Minutes</option>
                            <option value={30}>30 Minutes</option>
                            <option value={60}>1 Hour</option>
                            <option value={240}>4 Hours</option>
                            <option value={480}>8 Hours</option>
                            <option value={1440}>24 Hours</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                            Purpose
                          </label>
                          <select
                            value={requestPurpose}
                            onChange={(e) => setRequestPurpose(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-400"
                          >
                            <option>Personal Safety &amp; Coordination</option>
                            <option>Meeting Up / Rendezvous</option>
                            <option>Emergency Check-in</option>
                            <option>Travel &amp; Route Guidance</option>
                            <option>Delivery / Pickup Coordination</option>
                          </select>
                        </div>
                      </div>

                      {/* Prominent Action Button */}
                      <button
                        onClick={handleRequestLiveLocation}
                        disabled={isSendingLocationRequest || !phoneDigits.trim()}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] cursor-pointer disabled:opacity-50"
                      >
                        {isSendingLocationRequest ? (
                          <>
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            <span>Creating Secure Invitation...</span>
                          </>
                        ) : (
                          <>
                            <Radio className="w-4 h-4" />
                            <span>Request Live Location</span>
                          </>
                        )}
                      </button>

                      {locationRequestError && (
                        <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-3 text-[11px] text-rose-300 font-mono">
                          {locationRequestError}
                        </div>
                      )}

                      {/* Invitation Result & SMS Delivery Feedback */}
                      {locationRequestResult && (
                        <div className="bg-zinc-950/90 border border-cyan-500/40 rounded-2xl p-4 space-y-3 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-cyan-300">
                              Invitation Created
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                              locationRequestResult.smsSent
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                              {locationRequestResult.smsSent ? 'SMS Dispatched' : 'SMS Unconfigured'}
                            </span>
                          </div>

                          <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                            {locationRequestResult.smsMessage}
                          </p>

                          {/* Invitation URL Box */}
                          <div className="bg-black/70 border border-zinc-800 rounded-xl p-3 space-y-2">
                            <span className="text-[9px] text-zinc-500 uppercase font-bold block">
                              Secure Consent Link:
                            </span>
                            <p className="text-[10px] text-cyan-300 font-mono break-all line-clamp-2">
                              {locationRequestResult.shareUrl}
                            </p>
                            
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(locationRequestResult.shareUrl);
                                  setCopySuccess(true);
                                  setTimeout(() => setCopySuccess(false), 2000);
                                }}
                                className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copySuccess ? 'Copied Link!' : 'Copy Invitation Link'}</span>
                              </button>

                              {typeof navigator !== 'undefined' && (navigator as any).share && (
                                <button
                                  onClick={() => {
                                    (navigator as any).share({
                                      title: 'SUPERAI Maps Live Location Request',
                                      text: `${requesterName} requested your live location for ${requestPurpose}`,
                                      url: locationRequestResult.shareUrl,
                                    }).catch(() => {});
                                  }}
                                  className="px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-xs flex items-center justify-center"
                                  title="Share via Native Apps"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Quick In-App Tester Action */}
                          <button
                            onClick={() => setTesterInviteToken(locationRequestResult.token)}
                            className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Open Recipient Consent Portal (Live Test)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Active Location Sessions Tracker */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Active Location Sessions ({activeSessions.length})</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            setAutoFollowRecipient(!autoFollowRecipient);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                            autoFollowRecipient
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                              : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                          }`}
                          title="Automatically follow recipient GPS on map"
                        >
                          <Crosshair className="w-2.5 h-2.5" />
                          <span>Follow: {autoFollowRecipient ? 'ON' : 'OFF'}</span>
                        </button>
                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            fetchMySessions();
                          }}
                          className="text-zinc-500 hover:text-zinc-200 p-1 transition-colors cursor-pointer"
                          title="Refresh session statuses"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {activeSessions.length > 0 ? (
                      <div className="space-y-2">
                        {activeSessions.map((sess) => {
                          const isLive = sess.status === 'SHARING_ACTIVE';
                          const isStale = sess.lastCoordinates && (Date.now() - sess.lastCoordinates.timestamp > 60000);
                          const secondsAgo = sess.lastCoordinates 
                            ? Math.round((Date.now() - sess.lastCoordinates.timestamp) / 1000) 
                            : null;

                          return (
                            <div
                              key={sess.token}
                              className={`bg-zinc-900/70 border rounded-2xl p-3.5 transition-all space-y-2.5 ${
                                isLive
                                  ? 'border-cyan-500/60 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                                  : 'border-zinc-800'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-zinc-100 text-xs font-bold font-mono">
                                      {sess.recipientPhone}
                                    </h4>
                                    <span className={`text-[8px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                                      sess.status === 'SHARING_ACTIVE'
                                        ? 'bg-cyan-500 text-black'
                                        : sess.status === 'DECLINED'
                                        ? 'bg-rose-950 text-rose-300 border border-rose-900'
                                        : sess.status === 'PERMISSION_DENIED'
                                        ? 'bg-amber-950 text-amber-300 border border-amber-900'
                                        : sess.status === 'EXPIRED' || sess.status === 'SHARING_STOPPED'
                                        ? 'bg-zinc-800 text-zinc-400'
                                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                                    }`}>
                                      {sess.status === 'SHARING_ACTIVE' ? 'LIVE GPS ACTIVE' : sess.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                    Purpose: {sess.purpose}
                                  </p>
                                </div>
                              </div>

                              {/* Telemetry info if live coordinates exist */}
                              {isLive && sess.lastCoordinates && (
                                <div className="bg-black/60 border border-zinc-800 rounded-xl p-2.5 text-xs font-mono space-y-1">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-zinc-500">Freshness:</span>
                                    <span className={`font-bold ${isStale ? 'text-amber-400' : 'text-cyan-400'}`}>
                                      {isStale ? `⚠️ Stale (${secondsAgo}s ago)` : `🟢 Active (${secondsAgo}s ago)`}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-zinc-500">Accuracy:</span>
                                    <span className="text-zinc-200">±{sess.lastCoordinates.accuracy || 20}m radius</span>
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2 pt-1">
                                {isLive && sess.lastCoordinates && (
                                  <button
                                    onClick={() => handleFlyToLiveSession(sess)}
                                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    <Navigation className="w-3 h-3" />
                                    <span>Fly to GPS</span>
                                  </button>
                                )}

                                {sess.status !== 'SHARING_STOPPED' && sess.status !== 'EXPIRED' && (
                                  <button
                                    onClick={() => handleStopSession(sess.token)}
                                    className="px-3 bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-900 text-rose-400 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer"
                                  >
                                    Stop
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 text-center space-y-1.5">
                        <Radio className="w-6 h-6 text-zinc-600 mx-auto" />
                        <p className="text-xs text-zinc-400 font-bold uppercase">No Active Requests</p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          Enter a phone number above and click "Request Live Location" to create a consent invitation.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 1: EXPLORE & SEARCH */}
              {activeTab === 'search' && (
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Google Maps places, cities, addresses..."
                      className="w-full bg-black border border-emerald-500/40 rounded-xl py-3 pl-10 pr-10 text-emerald-200 placeholder:text-emerald-700 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-all font-mono"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    {searchQuery && (
                      <button
                        onClick={() => { setSearchQuery(''); resetSession(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-700 hover:text-emerald-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Predictions */}
                  <div className="space-y-1.5">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-2">
                        <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
                        <p className="text-[10px] text-emerald-600 font-mono uppercase tracking-widest animate-pulse">Querying Places Core...</p>
                      </div>
                    ) : suggestions.length > 0 ? (
                      suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left bg-black/60 hover:bg-emerald-950/40 border border-emerald-900/30 hover:border-emerald-500/50 rounded-xl p-3 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start gap-2.5">
                            <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                            <div>
                              <h4 className="text-emerald-300 text-xs font-bold group-hover:text-emerald-200">
                                {suggestion.placePrediction?.text.text}
                              </h4>
                              <p className="text-[10px] text-emerald-700 font-mono mt-0.5 line-clamp-1">
                                High-Precision Location Node
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : selectedPlace ? (
                      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-500 font-bold">Selected Destination</span>
                            <h3 className="text-emerald-300 text-sm font-bold mt-0.5">{selectedPlace.displayName}</h3>
                          </div>
                          <button
                            onClick={() => handleSavePlace(selectedPlace)}
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 cursor-pointer"
                            title="Save to Favorites"
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[11px] text-emerald-600 leading-relaxed font-mono">{selectedPlace.formattedAddress}</p>
                        
                        {selectedPlace.rating && (
                          <div className="flex items-center gap-2 pt-1 border-t border-emerald-900/40">
                            <div className="flex items-center text-amber-400 gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                              <span className="text-xs font-bold">{selectedPlace.rating}</span>
                            </div>
                            <span className="text-[10px] text-emerald-700">({selectedPlace.userRatingCount} Google reviews)</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button
                            onClick={() => handleNavigateToPlace(selectedPlace)}
                            className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black py-2 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Navigate</span>
                          </button>
                          <button
                            onClick={() => {
                              if (selectedPlace.location) {
                                setStreetViewPosition({ lat: selectedPlace.location.lat(), lng: selectedPlace.location.lng() });
                                setIsStreetViewActive(true);
                              }
                            }}
                            className="flex items-center justify-center gap-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Street View</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 px-4 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/5 border border-emerald-900/40 flex items-center justify-center mx-auto text-emerald-600">
                          <Globe className="w-6 h-6" />
                        </div>
                        <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Search Earth</h4>
                        <p className="text-[11px] text-emerald-700 leading-relaxed font-mono">
                          Explore billions of locations with Google Maps intelligence, live ratings, and instant routing.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: ROUTES & GPS DIRECTIONS */}
              {activeTab === 'directions' && (
                <div className="space-y-4">
                  <div className="bg-black/60 border border-emerald-900/40 rounded-xl p-3 space-y-2.5">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-500 font-bold">Route Architect</span>
                    
                    {/* Origin Input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={originInput}
                        onChange={(e) => setOriginInput(e.target.value)}
                        placeholder="Origin: e.g. Current Location"
                        className="w-full bg-emerald-950/20 border border-emerald-900/50 rounded-lg py-2 pl-8 pr-3 text-xs text-emerald-200 placeholder:text-emerald-800 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <Circle className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-emerald-500" />
                    </div>

                    {/* Swap button */}
                    <div className="flex justify-center -my-1">
                      <button
                        onClick={() => {
                          const temp = originInput;
                          setOriginInput(destinationInput);
                          setDestinationInput(temp);
                        }}
                        className="p-1 hover:bg-emerald-500/20 text-emerald-600 hover:text-emerald-300 rounded-full transition-colors cursor-pointer"
                        title="Swap Origin and Destination"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Destination Input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={destinationInput}
                        onChange={(e) => setDestinationInput(e.target.value)}
                        placeholder="Destination: e.g. Times Square, NY"
                        className="w-full bg-emerald-950/20 border border-emerald-900/50 rounded-lg py-2 pl-8 pr-3 text-xs text-emerald-200 placeholder:text-emerald-800 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-rose-500" />
                    </div>

                    {/* Travel Mode Selector */}
                    <div className="grid grid-cols-4 gap-1 pt-1">
                      {[
                        { mode: 'DRIVING', icon: Car, label: 'Drive' },
                        { mode: 'TRANSIT', icon: Train, label: 'Transit' },
                        { mode: 'WALKING', icon: Footprints, label: 'Walk' },
                        { mode: 'BICYCLING', icon: Bike, label: 'Bike' },
                      ].map(item => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.mode}
                            onClick={() => setTravelMode(item.mode as any)}
                            className={`flex flex-col items-center py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                              travelMode === item.mode
                                ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                                : 'bg-black/40 text-emerald-700 hover:text-emerald-400 border border-transparent'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 mb-0.5" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleCalculateDirections}
                      disabled={isRouteLoading}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                    >
                      {isRouteLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          <span>Calculating Route...</span>
                        </>
                      ) : (
                        <>
                          <Navigation2 className="w-4 h-4" />
                          <span>Calculate Route</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Route Summary Card */}
                  {routeResult && routeResult[0] && (
                    <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">Fastest Route (Live Traffic)</span>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded font-mono">
                          Optimal
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-emerald-300 font-mono">
                        <div>
                          <p className="text-[9px] text-emerald-600 uppercase font-bold">Estimated Time</p>
                          <p className="text-lg font-extrabold text-emerald-400">
                            {(routeResult[0] as any)?.duration ? `${Math.round(parseInt(String((routeResult[0] as any).duration)) / 60)} min` : 'Calculating...'}
                          </p>
                        </div>
                        <div className="w-px h-8 bg-emerald-900/60" />
                        <div>
                          <p className="text-[9px] text-emerald-600 uppercase font-bold">Distance</p>
                          <p className="text-lg font-extrabold text-emerald-400">
                            {(routeResult[0] as any)?.distanceMeters ? `${((routeResult[0] as any).distanceMeters / 1000).toFixed(1)} km` : 'Calculating...'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            if (routeResult[0]) {
                              const r = routeResult[0] as any;
                              mapService.saveTrip({
                                title: `${originInput || 'Origin'} to ${destinationInput || 'Destination'}`,
                                waypoints: [],
                                distance: r.distanceMeters || 0,
                                duration: parseInt(String(r.duration || 0))
                              }).then(() => loadData());
                            }
                          }}
                          className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Save Trip
                        </button>
                        <button
                          onClick={() => {
                            setRouteResult(null);
                            setIsNavigating(false);
                          }}
                          className="px-3 bg-red-950/30 hover:bg-red-900/30 border border-red-900/50 text-red-400 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}

                  {routeError && (
                    <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-3 text-red-400 text-xs font-mono">
                      {routeError}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: AI TRIP GENIE */}
              {activeTab === 'trips' && (
                <div className="space-y-4">
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-extrabold text-xs uppercase tracking-wider">AI Trip Genie</h3>
                    </div>
                    <p className="text-[11px] text-emerald-600 font-mono leading-relaxed">
                      Custom AI itineraries architected with real-world landmarks, timing, and budgets.
                    </p>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={tripDestination}
                        onChange={(e) => setTripDestination(e.target.value)}
                        placeholder="Where do you want to travel? (e.g. Kyoto, Rome, Iceland)"
                        className="w-full bg-black border border-emerald-900/60 focus:border-emerald-400 rounded-lg p-2.5 text-xs text-emerald-200 placeholder:text-emerald-800 font-mono focus:outline-none"
                      />

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div>
                          <label className="text-emerald-700 uppercase font-bold block mb-1">Duration</label>
                          <select
                            value={tripDuration}
                            onChange={(e) => setTripDuration(e.target.value)}
                            className="w-full bg-black border border-emerald-900/50 rounded-lg p-2 text-emerald-300 focus:outline-none"
                          >
                            <option>1-Day Express</option>
                            <option>3-Day Weekend</option>
                            <option>5-Day Tour</option>
                            <option>7-Day Grand Journey</option>
                            <option>2 Weeks Explorer</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-emerald-700 uppercase font-bold block mb-1">Travelers</label>
                          <select
                            value={tripTravelers}
                            onChange={(e) => setTripTravelers(e.target.value)}
                            className="w-full bg-black border border-emerald-900/50 rounded-lg p-2 text-emerald-300 focus:outline-none"
                          >
                            <option>Solo Traveler</option>
                            <option>Couple</option>
                            <option>Family with Kids</option>
                            <option>Group of Friends</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-emerald-700 uppercase font-mono font-bold block mb-1 text-[10px]">Travel Style</label>
                        <select
                          value={tripStyle}
                          onChange={(e) => setTripStyle(e.target.value)}
                          className="w-full bg-black border border-emerald-900/50 rounded-lg p-2 text-emerald-300 text-[10px] font-mono focus:outline-none"
                        >
                          <option>Culture &amp; Historic Sights</option>
                          <option>Foodie &amp; Culinary Exploration</option>
                          <option>Nature, Hiking &amp; Adventure</option>
                          <option>Budget-Friendly Backpacker</option>
                          <option>Relaxed Luxury &amp; Wellness</option>
                        </select>
                      </div>

                      <button
                        onClick={handleGenerateTrip}
                        disabled={isGeneratingTrip || !tripDestination.trim()}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
                      >
                        {isGeneratingTrip ? (
                          <>
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            <span>Architecting Itinerary...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Generate Itinerary</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* AI Generated Itinerary Output */}
                  {tripOutput && (
                    <div className="bg-black/80 border border-emerald-900/50 rounded-xl p-4 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">Architected Itinerary</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(tripOutput);
                            setCopySuccess(true);
                            setTimeout(() => setCopySuccess(false), 2000);
                          }}
                          className="text-emerald-500 hover:text-emerald-300 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                        >
                          {copySuccess ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="text-emerald-200 text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto custom-scrollbar pr-1">
                        {tripOutput}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: WORLD EXPLORER */}
              {activeTab === 'world' && (
                <div className="space-y-4">
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-emerald-300 text-xs font-bold uppercase tracking-wider">Planetary Explorer</h3>
                    </div>
                    <p className="text-[10px] text-emerald-600 font-mono">
                      Fast-fly to iconic world wonders with cinematic 3D camera angles.
                    </p>
                  </div>

                  {/* Wonders List */}
                  <div className="space-y-2">
                    {WORLD_WONDERS.map((wonder) => {
                      const isVisited = visitedWonders.includes(wonder.id);
                      return (
                        <div
                          key={wonder.id}
                          className="bg-black/60 hover:bg-emerald-950/40 border border-emerald-900/40 hover:border-emerald-500/50 rounded-xl p-3 transition-all space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-emerald-300 text-xs font-bold">{wonder.name}</h4>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                                  {wonder.country}
                                </span>
                              </div>
                              <p className="text-[10px] text-emerald-600 font-mono mt-0.5 line-clamp-1">{wonder.desc}</p>
                            </div>
                            <button
                              onClick={() => toggleWonderVisited(wonder.id)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isVisited
                                  ? 'bg-emerald-500 text-black border-emerald-400'
                                  : 'bg-emerald-950/40 border-emerald-900/60 text-emerald-700 hover:text-emerald-400'
                              }`}
                              title={isVisited ? 'Marked as Visited!' : 'Mark as Visited'}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-[9px] font-mono text-emerald-700 pt-1 border-t border-emerald-950">
                            <span>Currency: {wonder.currency}</span>
                            <span>Lang: {wonder.language}</span>
                            <button
                              onClick={() => handleFlyToWonder(wonder)}
                              className="text-emerald-400 hover:text-emerald-200 font-bold uppercase flex items-center gap-1 cursor-pointer"
                            >
                              <span>Fly Here</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: SAVED PLACES & TRIPS */}
              {activeTab === 'saved' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 font-bold">
                      Saved Nodes ({savedPlaces.length})
                    </span>
                  </div>

                  {savedPlaces.length > 0 ? (
                    <div className="space-y-2">
                      {savedPlaces.map((place) => (
                        <div
                          key={place.id}
                          className="bg-black/60 border border-emerald-900/40 rounded-xl p-3 hover:border-emerald-500/50 transition-all flex items-start justify-between cursor-pointer group"
                          onClick={() => {
                            setCameraProps({
                              center: { lat: place.lat, lng: place.lng },
                              zoom: 16
                            });
                          }}
                        >
                          <div className="flex items-start gap-2.5">
                            <Bookmark className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-emerald-300 text-xs font-bold group-hover:text-emerald-200">{place.name}</h4>
                              <p className="text-[10px] text-emerald-700 font-mono mt-0.5 line-clamp-1">{place.address}</p>
                              <span className="inline-block mt-1 text-[8px] font-mono uppercase px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
                                {place.category || 'Saved'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (place.id) {
                                mapService.deletePlace(place.id).then(() => loadData());
                              }
                            }}
                            className="p-1 text-emerald-800 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Place"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 px-4 space-y-2">
                      <Bookmark className="w-8 h-8 text-emerald-900 mx-auto mb-1" />
                      <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">No Saved Places Yet</p>
                      <p className="text-[10px] text-emerald-700 font-mono">
                        Click the bookmark icon on any search result or landmark to archive it here.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Interactive Google Map Section */}
          <div className="flex-1 relative bg-black">
            
            {/* Sidebar Toggle Handle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-[25] bg-black/90 border border-emerald-500/30 border-l-0 rounded-r-xl p-2 text-emerald-400 hover:text-emerald-200 transition-all shadow-xl cursor-pointer"
              title={isSidebarOpen ? 'Collapse Drawer' : 'Expand Drawer'}
            >
              {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {/* Floating Map Controls Toolbar (Top Right) */}
            <div className="absolute top-4 right-4 z-[25] flex flex-col gap-2">
              <div className="flex flex-col bg-zinc-950/90 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
                
                {/* Map Type Cycle: Roadmap -> Satellite -> Hybrid -> Terrain */}
                <button
                  onClick={() => {
                    const types: Array<'roadmap' | 'satellite' | 'hybrid' | 'terrain'> = ['roadmap', 'satellite', 'hybrid', 'terrain'];
                    const next = types[(types.indexOf(mapType) + 1) % types.length];
                    setMapType(next);
                  }}
                  className="p-2.5 text-zinc-300 hover:text-white hover:bg-zinc-800/60 border-b border-zinc-800/60 transition-colors flex items-center gap-2 cursor-pointer"
                  title={`Map Style: ${mapType.toUpperCase()}`}
                >
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-mono font-bold uppercase hidden md:inline">{mapType}</span>
                </button>

                {/* 3D Tilt Toggle */}
                <button
                  onClick={() => setCameraProps(prev => ({ ...prev, tilt: prev.tilt === 45 ? 0 : 45 }))}
                  className={`p-2.5 transition-colors border-b border-zinc-800/60 flex items-center gap-2 cursor-pointer ${
                    cameraProps.tilt === 45 ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                  }`}
                  title="Toggle 3D Perspective Tilt (45°)"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-[10px] font-mono uppercase hidden md:inline">3D</span>
                </button>

                {/* Compass Heading Rotation (Reset North or +45°) */}
                <button
                  onClick={handleResetNorth}
                  className="p-2.5 text-zinc-300 hover:text-white hover:bg-zinc-800/60 border-b border-zinc-800/60 transition-colors flex items-center gap-2 cursor-pointer"
                  title="Click to Reset North (0°)"
                >
                  <CompassIcon className="w-4 h-4 text-cyan-400" style={{ transform: `rotate(${-(cameraProps.heading || 0)}deg)` }} />
                  <span className="text-[10px] font-mono uppercase hidden md:inline">{Math.round(cameraProps.heading || 0)}°</span>
                </button>

                {/* Live Traffic Overlay Toggle */}
                <button
                  onClick={() => setIsTrafficActive(!isTrafficActive)}
                  className={`p-2.5 transition-colors border-b border-zinc-800/60 flex items-center gap-2 cursor-pointer ${
                    isTrafficActive ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                  }`}
                  title="Toggle Real-Time Google Traffic Flow"
                >
                  <Car className="w-4 h-4" />
                  <span className="text-[10px] font-mono uppercase hidden md:inline">Traffic</span>
                </button>

                {/* Interactive Street View Toggle */}
                <button
                  onClick={() => {
                    if (!isStreetViewActive) {
                      const pos = selectedPlace?.location
                        ? { lat: selectedPlace.location.lat(), lng: selectedPlace.location.lng() }
                        : (cameraProps.center as { lat: number; lng: number });
                      setStreetViewPosition(pos);
                    }
                    setIsStreetViewActive(!isStreetViewActive);
                  }}
                  className={`p-2.5 transition-colors border-b border-zinc-800/60 flex items-center gap-2 cursor-pointer ${
                    isStreetViewActive ? 'bg-cyan-500 text-black font-bold' : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                  }`}
                  title="Toggle 360° Google Street View"
                >
                  <Camera className="w-4 h-4" />
                  <span className="text-[10px] font-mono uppercase hidden md:inline">Street</span>
                </button>

                {/* Zoom In */}
                <button
                  onClick={handleZoomIn}
                  className="p-2.5 text-zinc-300 hover:text-white hover:bg-zinc-800/60 border-b border-zinc-800/60 transition-colors flex items-center justify-center cursor-pointer"
                  title="Zoom In (+)"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Zoom Out */}
                <button
                  onClick={handleZoomOut}
                  className="p-2.5 text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-colors flex items-center justify-center cursor-pointer"
                  title="Zoom Out (-)"
                >
                  <Minus className="w-4 h-4" />
                </button>

              </div>
            </div>

            {/* The Google Map Component */}
            <div className="w-full h-full relative">
              
              {/* Floating Region HUD directly on Map */}
              {numberRegionCircle && numberRegionCircle.isVisible && (
                <div className="absolute top-4 left-4 z-[25] pointer-events-auto bg-zinc-950/90 backdrop-blur-md border border-amber-500/50 rounded-2xl p-3.5 shadow-2xl max-w-[280px] space-y-2 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                        <Radio className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-amber-300 font-extrabold text-xs uppercase tracking-wide leading-tight line-clamp-1">
                          {numberRegionCircle.regionName}
                        </h4>
                        <span className="text-[9px] text-zinc-400 font-mono">
                          {(numberRegionCircle.radiusMeters / 1000).toFixed(1)} km radius · ~{Math.round(Math.PI * Math.pow(numberRegionCircle.radiusMeters / 1000, 2)).toLocaleString()} km²
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setNumberRegionCircle(prev => prev ? ({ ...prev, isVisible: false }) : null)}
                      className="p-1 text-zinc-500 hover:text-zinc-200 rounded transition-colors cursor-pointer"
                      title="Hide Overlay"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-[10px] font-mono space-y-1 text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Center:</span>
                      <span className="text-amber-300 font-bold">
                        {numberRegionCircle.center.lat.toFixed(4)}, {numberRegionCircle.center.lng.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Coverage Area:</span>
                      <span className="text-zinc-200 font-bold">
                        ~{Math.round(Math.PI * Math.pow(numberRegionCircle.radiusMeters / 1000, 2)).toLocaleString()} km² ({Math.round(Math.PI * Math.pow(numberRegionCircle.radiusMeters / 1000, 2) * 0.386102).toLocaleString()} sq mi)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Mode:</span>
                      <span className={numberRegionCircle.isManualAdjustment ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {numberRegionCircle.isManualAdjustment ? 'Manual Adjusted' : 'Source Verified'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={handleFlyToRegionCircle}
                      className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Crosshair className="w-3 h-3 text-amber-400" />
                      <span>Center Map</span>
                    </button>
                    {numberRegionCircle.isManualAdjustment && (
                      <button
                        onClick={handleResetRadiusToSource}
                        className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        title="Reset to Source Radius"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}

              <Map
                {...cameraProps}
                mapId={mapId}
                mapTypeId={mapType}
                onCameraChanged={handleCameraChange}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
                disableDefaultUI={true}
                gestureHandling={'greedy'}
              >
                {/* Traffic Layer Component */}
                <GoogleTrafficLayer visible={isTrafficActive} />

                {/* Advanced Markers for Saved Places */}
                {savedPlaces.map(place => (
                  <AdvancedMarker
                    key={place.id}
                    position={{ lat: place.lat, lng: place.lng }}
                    title={place.name}
                  >
                    <Pin background={'#10b981'} glyphColor={'#000'} borderColor={'#064e3b'} />
                  </AdvancedMarker>
                ))}

                {/* GPS Current Location Radar Marker */}
                {currentGpsLocation && (
                  <AdvancedMarker position={currentGpsLocation} title="Your GPS Location">
                    <div className="relative flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-emerald-400 border-2 border-black z-10 shadow-[0_0_15px_#10b981]" />
                      <div className="absolute w-10 h-10 rounded-full bg-emerald-500/30 animate-ping" />
                    </div>
                  </AdvancedMarker>
                )}

                {/* AI NUMBER REGION CIRCLE OVERLAY (Telecom Number Allocation Estimate) */}
                {numberRegionCircle && numberRegionCircle.isVisible && (
                  <>
                    <NumberRegionCircleOverlay
                      center={numberRegionCircle.center}
                      radiusMeters={numberRegionCircle.radiusMeters}
                    />

                    {/* Central Telecom Antenna Landmark Marker */}
                    <AdvancedMarker
                      position={numberRegionCircle.center}
                      title={`AI Number Region: ${numberRegionCircle.regionName}`}
                      onClick={() => handleFlyToRegionCircle()}
                    >
                      <div className="relative flex flex-col items-center cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-amber-500 border-2 border-black flex items-center justify-center shadow-[0_0_18px_rgba(245,158,11,0.8)] animate-pulse">
                          <Radio className="w-4 h-4 text-black" />
                        </div>
                        <div className="mt-1 px-2.5 py-0.5 bg-black/95 border border-amber-500/80 rounded-md text-[9px] text-amber-300 font-mono font-bold whitespace-nowrap shadow-xl flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>{numberRegionCircle.regionName}</span>
                          <span className="text-[8px] text-amber-500">({(numberRegionCircle.radiusMeters / 1000).toFixed(0)}km)</span>
                        </div>
                        <div className="px-1.5 py-0.2 bg-amber-950/90 border border-amber-800/80 rounded text-[7px] text-amber-400 font-mono uppercase tracking-wider mt-0.5">
                          Telecom Inferred Circle • Not GPS
                        </div>
                      </div>
                    </AdvancedMarker>
                  </>
                )}

                {/* LIVE RECIPIENT LOCATION MARKERS (Consent-Based) */}
                {activeSessions
                  .filter(s => s.status === 'SHARING_ACTIVE' && s.lastCoordinates)
                  .map(s => {
                    const isStale = (Date.now() - s.lastCoordinates.timestamp) > 60000;
                    return (
                      <React.Fragment key={s.token}>
                        <AdvancedMarker
                          position={{ lat: s.lastCoordinates.lat, lng: s.lastCoordinates.lng }}
                          title={`Live Location: ${s.recipientPhone}`}
                          onClick={() => setSelectedSessionForMap(s)}
                        >
                          <div className="relative flex flex-col items-center cursor-pointer">
                            <div className="w-10 h-10 rounded-full bg-cyan-400 border-2 border-black flex items-center justify-center shadow-[0_0_18px_#22d3ee] animate-pulse">
                              <Radio className="w-5 h-5 text-black" />
                            </div>
                            <div className="mt-1 px-2.5 py-0.5 bg-black/95 border border-cyan-400 rounded-md text-[9px] text-cyan-300 font-mono font-bold whitespace-nowrap shadow-xl flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${isStale ? 'bg-amber-400' : 'bg-cyan-400 animate-ping'}`} />
                              <span>{s.recipientPhone}</span>
                            </div>
                          </div>
                        </AdvancedMarker>

                        {/* Accuracy Radius Circle around recipient */}
                        <AccuracyCircle
                          center={{ lat: s.lastCoordinates.lat, lng: s.lastCoordinates.lng }}
                          radius={s.lastCoordinates.accuracy || 25}
                        />
                      </React.Fragment>
                    );
                  })}

                {/* Selected Place Marker & Rich InfoWindow */}
                {selectedPlace && selectedPlace.location && (
                  <>
                    <AdvancedMarker
                      ref={markerRef}
                      position={{ lat: selectedPlace.location.lat(), lng: selectedPlace.location.lng() }}
                      onClick={() => setSelectedPlace(selectedPlace)}
                    >
                      <div className="relative flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-emerald-400 border-2 border-black flex items-center justify-center shadow-2xl animate-bounce">
                          <MapPin className="w-5 h-5 text-black" />
                        </div>
                        <div className="mt-1 px-2 py-0.5 bg-black/90 border border-emerald-400 rounded-md text-[9px] text-emerald-300 font-bold whitespace-nowrap shadow-md">
                          {selectedPlace.displayName}
                        </div>
                      </div>
                    </AdvancedMarker>

                    <InfoWindow
                      anchor={marker}
                      onCloseClick={() => setSelectedPlace(null)}
                      headerDisabled
                    >
                      <div className="p-3.5 min-w-[240px] max-w-[280px] bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-2xl font-sans shadow-2xl">
                        <div className="flex justify-between items-start mb-1.5">
                          <div>
                            <h4 className="font-extrabold text-sm text-zinc-100 leading-tight">{selectedPlace.displayName}</h4>
                            <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-2">{selectedPlace.formattedAddress}</p>
                          </div>
                          <button
                            onClick={() => handleSavePlace(selectedPlace)}
                            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 rounded transition-colors cursor-pointer"
                            title="Save Place"
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                        </div>

                        {selectedPlace.rating && (
                          <div className="flex items-center gap-2 my-2 pt-2 border-t border-zinc-800">
                            <div className="flex items-center text-amber-400 gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                              <span className="text-xs font-bold">{selectedPlace.rating}</span>
                            </div>
                            <span className="text-[9px] text-zinc-500 font-mono">({selectedPlace.userRatingCount} reviews)</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <button
                            onClick={() => handleNavigateToPlace(selectedPlace)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-bold py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Navigate</span>
                          </button>
                          <button
                            onClick={() => {
                              if (selectedPlace.location) {
                                setStreetViewPosition({ lat: selectedPlace.location.lat(), lng: selectedPlace.location.lng() });
                                setIsStreetViewActive(true);
                              }
                            }}
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] font-bold py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Street View</span>
                          </button>
                        </div>
                      </div>
                    </InfoWindow>
                  </>
                )}

                {/* Route Polyline Rendering */}
                {routeResult && routeResult[0] && (
                  <RoutePolyline route={routeResult[0]} />
                )}
              </Map>

              {/* Interactive Street View Panorama Overlay */}
              {isStreetViewActive && streetViewPosition && (
                <div className="absolute inset-0 z-[28] bg-black flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2 bg-zinc-950/95 border-b border-zinc-800 z-10">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Interactive 360° Google Street View</span>
                    </div>
                    <button
                      onClick={() => setIsStreetViewActive(false)}
                      className="px-3 py-1 bg-zinc-900 hover:bg-rose-950/40 border border-zinc-700 hover:border-rose-900 text-rose-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Exit Street View</span>
                    </button>
                  </div>
                  <div className="flex-1 w-full h-full relative">
                    <StreetViewContainer position={streetViewPosition} />
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Map Visual Distinction Legend */}
            <div className="absolute bottom-4 left-4 z-[24] pointer-events-auto bg-zinc-950/90 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-3 shadow-2xl max-w-[280px] space-y-2 text-[10px] font-mono">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
                <button
                  onClick={() => setIsLegendExpanded(!isLegendExpanded)}
                  className="text-zinc-200 font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1.5 hover:text-white cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Map Visual Legend</span>
                  <span className="text-[8px] text-zinc-500 font-normal">({isLegendExpanded ? 'hide' : 'show'})</span>
                </button>
                <span className="text-[8px] text-zinc-500 font-bold">SUPERAI</span>
              </div>

              {isLegendExpanded && (
                <div className="space-y-2 pt-0.5 animate-in fade-in">
                  {/* Estimated Numbering Region */}
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded border-2 border-dashed border-amber-400 bg-amber-500/20 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-300 text-[10px]">Estimated Numbering Region</div>
                      <div className="text-[8.5px] text-zinc-400 leading-tight">
                        Dashed amber stroke &amp; translucent fill. Telecom wire exchange estimate; NOT a live device GPS position.
                      </div>
                    </div>
                  </div>

                  {/* Consented Live Location */}
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-cyan-400 bg-cyan-500/25 shrink-0 mt-0.5 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
                    </div>
                    <div>
                      <div className="font-bold text-cyan-300 text-[10px]">Consented Device GPS</div>
                      <div className="text-[8.5px] text-zinc-400 leading-tight">
                        Solid cyan stroke &amp; reported accuracy radius in meters. Explicitly granted device sensor coordinates.
                      </div>
                    </div>
                  </div>

                  {/* Saved / Searched Places */}
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-500/20 shrink-0 mt-0.5 flex items-center justify-center">
                      <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-bold text-emerald-400 text-[10px]">Saved &amp; Searched Places</div>
                      <div className="text-[8.5px] text-zinc-400 leading-tight">
                        Pins for landmarks, restaurants, cafes, and custom bookmarked nodes.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Floating Telemetry Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[25] pointer-events-none hidden sm:flex">
              <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 px-6 py-2 rounded-full flex items-center gap-5 shadow-2xl">
                <div className="flex flex-col items-center">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold font-mono">Module</span>
                  <span className="text-[10px] text-zinc-200 font-mono font-bold">AI Number Region Circle</span>
                </div>
                <div className="w-px h-5 bg-zinc-800" />
                <div className="flex flex-col items-center">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold font-mono">Maps Core</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">Google Maps JS</span>
                </div>
                <div className="w-px h-5 bg-zinc-800" />
                <div className="flex flex-col items-center">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold font-mono">Consent Security</span>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    E2E Verified
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* In-App Recipient Consent Tester Modal */}
        {testerInviteToken && (
          <RecipientConsentModal
            inviteToken={testerInviteToken}
            onClose={() => setTesterInviteToken(null)}
          />
        )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }
        .gm-style-iw-c {
          background: black !important;
          padding: 0 !important;
          border: 1px solid rgba(16, 185, 129, 0.4) !important;
          box-shadow: 0 0 25px rgba(16, 185, 129, 0.2) !important;
          border-radius: 12px !important;
        }
        .gm-style-iw-d {
          overflow: hidden !important;
          max-height: none !important;
        }
        .gm-style-iw-tc::after {
          background: black !important;
        }
      `}</style>
      </div>
    </div>
  );
};

/**
 * Accuracy Radius Circle Component for live shared locations
 */
const AccuracyCircle = ({ center, radius }: { center: { lat: number; lng: number }; radius: number }) => {
  const map = useMap();
  const circleRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !center) return;
    const gmaps = (window as any).google?.maps;
    if (!gmaps?.Circle) return;

    if (!circleRef.current) {
      circleRef.current = new gmaps.Circle({
        strokeColor: '#06b6d4',
        strokeOpacity: 0.8,
        strokeWeight: 1.5,
        fillColor: '#0891b2',
        fillOpacity: 0.15,
        map: map,
        center: center,
        radius: Math.max(radius || 20, 10),
      });
    } else {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(Math.max(radius || 20, 10));
      circleRef.current.setMap(map);
    }

    return () => {
      circleRef.current?.setMap(null);
    };
  }, [map, center.lat, center.lng, radius]);

  return null;
};

/**
 * Visual Geographic-Region Estimate Circle for phone number metadata.
 * Style: Translucent amber fill with a DASHED outline (repeating symbol icon) and clear visual distinction from GPS sensor circles.
 */
const NumberRegionCircleOverlay = ({
  center,
  radiusMeters,
}: {
  center: { lat: number; lng: number };
  radiusMeters: number;
}) => {
  const map = useMap();
  const fillCircleRef = useRef<any>(null);
  const dashedOutlineRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !center) return;
    const gmaps = (window as any).google?.maps;
    if (!gmaps?.Circle || !gmaps?.Polyline) return;

    // 1. Translucent amber fill circle (borderless fill)
    if (!fillCircleRef.current) {
      fillCircleRef.current = new gmaps.Circle({
        map,
        center,
        radius: Math.max(radiusMeters || 1000, 500),
        strokeOpacity: 0,
        fillColor: '#f59e0b',
        fillOpacity: 0.14,
        clickable: false,
      });
    } else {
      fillCircleRef.current.setCenter(center);
      fillCircleRef.current.setRadius(Math.max(radiusMeters || 1000, 500));
      fillCircleRef.current.setMap(map);
    }

    // 2. Compute 64 points along geodesic circle perimeter for dashed stroke
    const points: { lat: number; lng: number }[] = [];
    const earthRadius = 6378137;
    const rad = Math.max(radiusMeters || 1000, 500);
    const dLat = (rad / earthRadius) * (180 / Math.PI);
    const cosLat = Math.cos((center.lat * Math.PI) / 180);
    const dLng = dLat / (cosLat === 0 ? 0.00001 : cosLat);
    const numPoints = 64;

    for (let i = 0; i <= numPoints; i++) {
      const theta = (Math.PI * 2 * i) / numPoints;
      const ptLat = center.lat + dLat * Math.sin(theta);
      const ptLng = center.lng + dLng * Math.cos(theta);
      points.push({ lat: ptLat, lng: ptLng });
    }

    if (!dashedOutlineRef.current) {
      dashedOutlineRef.current = new gmaps.Polyline({
        path: points,
        geodesic: true,
        strokeOpacity: 0,
        icons: [{
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: 0.9,
            strokeWeight: 2.5,
            scale: 2.5,
            strokeColor: '#f59e0b',
          },
          offset: '0',
          repeat: '14px',
        }],
        map,
        clickable: false,
      });
    } else {
      dashedOutlineRef.current.setPath(points);
      dashedOutlineRef.current.setMap(map);
    }

    return () => {
      fillCircleRef.current?.setMap(null);
      dashedOutlineRef.current?.setMap(null);
    };
  }, [map, center.lat, center.lng, radiusMeters]);

  return null;
};

/**
 * Traffic Layer overlay component
 */
const GoogleTrafficLayer = ({ visible }: { visible: boolean }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const trafficLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !mapsLib) return;
    if (!trafficLayerRef.current) {
      trafficLayerRef.current = new (mapsLib as any).TrafficLayer();
    }
    trafficLayerRef.current.setMap(visible ? map : null);
    return () => {
      trafficLayerRef.current?.setMap(null);
    };
  }, [map, mapsLib, visible]);

  return null;
};

/**
 * Street View Panorama Canvas component
 */
const StreetViewContainer = ({ position }: { position: { lat: number; lng: number } }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const streetViewLib = useMapsLibrary('streetView');

  useEffect(() => {
    if (!containerRef.current || !position) return;
    const gmaps = (window as any).google?.maps;
    if (!gmaps?.StreetViewPanorama) return;
    const panorama = new gmaps.StreetViewPanorama(containerRef.current, {
      position: { lat: position.lat, lng: position.lng },
      pov: { heading: 165, pitch: 0 },
      zoom: 1,
      visible: true
    });

    return () => {
      panorama.setVisible(false);
    };
  }, [containerRef, position, streetViewLib]);

  return <div ref={containerRef} className="w-full h-full" />;
};

/**
 * Component to decode and render a route polyline on the Google Map
 */
const RoutePolyline = ({ route }: { route: any }) => {
  const map = useMap();
  const geometryLib = useMapsLibrary('geometry');
  const [polyline, setPolyline] = useState<any>(null);

  useEffect(() => {
    if (!map || !route.polyline?.encodedPolyline) return;

    // Use geometry library if loaded or window.google.maps.geometry
    const geom = geometryLib || (window as any).google?.maps?.geometry;
    if (!geom?.encoding) return;

    const path = geom.encoding.decodePath(route.polyline.encodedPolyline);
    
    const gmaps = (window as any).google?.maps;
    if (!gmaps) return;

    const newPolyline = new gmaps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#10b981',
      strokeOpacity: 0.9,
      strokeWeight: 5,
      map: map
    });

    setPolyline(newPolyline);

    // Fit map bounds to encompass route
    const bounds = new gmaps.LatLngBounds();
    path.forEach((p: any) => bounds.extend(p));
    map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 360 });

    return () => {
      newPolyline.setMap(null);
    };
  }, [map, geometryLib, route]);

  return null;
};
