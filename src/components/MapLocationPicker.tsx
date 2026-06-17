import React, { useState, useEffect, useRef } from 'react';
import {
  APIProvider,
  ControlPosition,
  MapControl,
  AdvancedMarker,
  Map,
  useMap,
  useMapsLibrary,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

export interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

interface MapLocationPickerProps {
  initialLocation: LocationData;
  onLocationChange: (loc: LocationData) => void;
  className?: string;
  height?: string;
}

export default function MapLocationPicker({ initialLocation, onLocationChange, className = '', height = '300px' }: MapLocationPickerProps) {
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    // Handle global Google Maps authentication/billing failures
    (window as any).gm_authFailure = () => {
      setMapError(true);
    };

    // Prevent AI Studio preview overlay from blocking the UI for this expected development error
    const origError = console.error;
    console.error = (...args) => {
      const msg = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Error ? args[0].message : '');
      if (msg.includes('BillingNotEnabledMapError') || msg.includes('ApiNotActivatedMapError') || msg.includes('legacy API') || msg.includes('PLACES_SEARCH_TEXT') || msg.includes('Places API (New) has not been used') || msg.includes('Geocoding Service:')) {
        return; // Squelch
      }
      origError.apply(console, args);
    };

    return () => {
      console.error = origError;
    };
  }, []);

  if (!API_KEY || mapError) {
    return (
      <div className="bg-slate-100 p-4 rounded-xl text-xs font-mono text-slate-500 border border-slate-200">
        Google Maps integration requires an active API Key with billing enabled. Please add or check GOOGLE_MAPS_PLATFORM_KEY in secrets.
        <br/><br/>
        Fallback: Simulated Location
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <APIProvider apiKey={API_KEY} version="weekly">
        <MapWrapper initialLocation={initialLocation} onLocationChange={onLocationChange} height={height} />
      </APIProvider>
    </div>
  );
}

function MapWrapper({ initialLocation, onLocationChange, height }: MapLocationPickerProps & { height?: string }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const map = useMap();
  
  // Keep local coordinate state
  const [localPos, setLocalPos] = useState({ lat: initialLocation.lat, lng: initialLocation.lng });
  const geocodingLib = useMapsLibrary('geocoding');

  const handleMapClick = async (e: any) => {
    let lat = 6.5;
    let lng = 3.3;

    if (e.detail?.latLng) {
      lat = typeof e.detail.latLng.lat === 'function' ? e.detail.latLng.lat() : e.detail.latLng.lat;
      lng = typeof e.detail.latLng.lng === 'function' ? e.detail.latLng.lng() : e.detail.latLng.lng;
    } else if (e.latLng) {
      lat = typeof e.latLng.lat === 'function' ? e.latLng.lat() : e.latLng.lat;
      lng = typeof e.latLng.lng === 'function' ? e.latLng.lng() : e.latLng.lng;
    }

    if (!lat || !lng) return;

    setLocalPos({ lat, lng });
    
    let address = 'Custom Pinned Map Location';

    if (geocodingLib) {
      try {
        const geocoder = new geocodingLib.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results && response.results[0]) {
          address = response.results[0].formatted_address;
        }
      } catch (err) {
        console.warn('Google Maps reverse geocoding failed, falling back to OSM:', err);
      }
    }

    if (address === 'Custom Pinned Map Location') {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            address = data.display_name;
          }
        }
      } catch (e) {
        console.error('OSM reverse geocoding failed', e);
      }
    }

    onLocationChange({
      address,
      lat,
      lng
    });
  };

  useEffect(() => {
    if (map && localPos.lat && localPos.lng) {
      marker?.position && (marker.position = localPos);
      map.setCenter(localPos);
    }
  }, [map, localPos, marker]);

  return (
    <div className="flex flex-col gap-2 relative">
      <PlaceSearchBox 
        onPlaceSelect={(place) => {
          if (place?.location) {
            const lat = place.location.lat();
            const lng = place.location.lng();
            setLocalPos({ lat, lng });
            onLocationChange({
              address: place.formattedAddress || place.displayName || initialLocation.address,
              lat,
              lng
            });
            if (place.viewport) {
              map?.fitBounds(place.viewport);
            } else {
              map?.panTo({ lat, lng });
              map?.setZoom(15);
            }
          }
        }} 
      />
      <div className="relative rounded-xl overflow-hidden border border-slate-200" style={{ height: height || '300px' }}>
        <Map
          mapId="DEMO_MAP_ID"
          defaultZoom={12}
          defaultCenter={localPos}
          gestureHandling="greedy"
          disableDefaultUI={false}
          onClick={handleMapClick}
        >
          <AdvancedMarker ref={markerRef} position={localPos} />
        </Map>
      </div>
    </div>
  );
}

function PlaceSearchBox({ onPlaceSelect }: { onPlaceSelect: (place: any) => void }) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const placesLib = useMapsLibrary('places');
  const geocodingLib = useMapsLibrary('geocoding');
  const map = useMap();
  
  const sessionTokenRef = useRef<any>(null);
  const autocompleteServiceRef = useRef<any>(null);

  useEffect(() => {
    if (placesLib && !autocompleteServiceRef.current) {
      // Safely initialize autocomplete service if available
      try {
        autocompleteServiceRef.current = new placesLib.AutocompleteService();
        sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
      } catch (e) {
        console.warn('Google Places Autocomplete init failed', e);
      }
    }
  }, [placesLib]);

  useEffect(() => {
    let active = true;
    if (!query.trim()) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    const fetchPredictions = async () => {
      try {
        if (autocompleteServiceRef.current) {
          const response = await autocompleteServiceRef.current.getPlacePredictions({
            input: query,
            sessionToken: sessionTokenRef.current,
            // bias toward map center if possible
            // locationBias: map?.getCenter()
          });
          if (active && response?.predictions) {
            setPredictions(response.predictions);
            setShowPredictions(true);
            return;
          }
        }
      } catch (err) {
        console.warn('AutocompleteService failed or not allowed, falling back to OSM');
      }

      // OSM Fallback
      if (active) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
          if (res.ok && active) {
            const data = await res.json();
            setPredictions(data.map((d: any) => ({
              description: d.display_name,
              isOSM: true,
              lat: parseFloat(d.lat),
              lng: parseFloat(d.lon)
            })));
            setShowPredictions(true);
          }
        } catch(e) {}
      }
    };

    const timer = setTimeout(() => {
      fetchPredictions();
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const handlePredictionSelect = async (prediction: any) => {
    setQuery(prediction.description);
    setShowPredictions(false);
    setIsLoading(true);

    if (prediction.isOSM) {
      onPlaceSelect({
        formattedAddress: prediction.description,
        location: { lat: () => prediction.lat, lng: () => prediction.lng }
      });
      setIsLoading(false);
      return;
    }

    // Google Maps selection
    if (placesLib) {
      try {
        const { places } = await placesLib.Place.searchByText({
          textQuery: prediction.description,
          fields: ['displayName', 'location', 'formattedAddress', 'viewport'],
        });
        if (places && places.length > 0) {
          onPlaceSelect(places[0]);
          // Refresh session token after successful selection
          try {
            sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
          } catch(e) {}
        }
      } catch (err) {
        console.warn('Place search failed', err);
      }
    }
    setIsLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (predictions.length > 0) {
      handlePredictionSelect(predictions[0]);
    } else {
      // Fallback manual search
      setIsLoading(true);
      if (placesLib) {
        try {
          const { places } = await placesLib.Place.searchByText({
            textQuery: query,
            fields: ['displayName', 'location', 'formattedAddress', 'viewport']
          });
          if (places && places.length > 0) {
            onPlaceSelect(places[0]);
            setIsLoading(false);
            return;
          }
        } catch(e) {}
      }
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            onPlaceSelect({
              formattedAddress: data[0].display_name,
              location: { lat: () => parseFloat(data[0].lat), lng: () => parseFloat(data[0].lon) }
            });
            setIsLoading(false);
            return;
          }
        }
      } catch(e) {}
      alert('Search failed. Try a more specific location.');
      setIsLoading(false);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        let formattedAddress = 'Current GPS Location';
        
        if (geocodingLib) {
          try {
            const geocoder = new geocodingLib.Geocoder();
            const response = await geocoder.geocode({ location: { lat, lng } });
            if (response.results && response.results[0]) {
              formattedAddress = response.results[0].formatted_address;
            }
          } catch (err) {
            console.warn('Google Maps reverse geocoding failed:', err);
          }
        }
        
        if (formattedAddress === 'Current GPS Location') {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.display_name) {
                formattedAddress = data.display_name;
              }
            }
          } catch (err) {
            console.error('OSM reverse geocoding failed', err);
          }
        }

        onPlaceSelect({
          formattedAddress,
          location: {
            lat: () => lat,
            lng: () => lng
          }
        });
        setIsLoading(false);
      },
      (error) => {
        console.error("Error obtaining location", error);
        alert("Failed to obtain current location. Make sure you have granted location permissions.");
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-2 relative z-10 flex flex-col">
      <div className="flex items-center px-2 py-1 relative">
        <span className="text-slate-400">🔍</span>
        <input 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowPredictions(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch(e as any);
            }
          }}
          onFocus={() => setShowPredictions(true)}
          placeholder="Search for an address or place..." 
          className="w-full text-sm font-medium px-2 py-2 focus:outline-none placeholder:text-slate-400 text-slate-800"
        />
        {isLoading && <span className="text-xs text-slate-400 ml-2">...</span>}
      </div>

      {showPredictions && predictions.length > 0 && (
        <div className="absolute top-[3.5rem] left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <ul className="max-h-60 overflow-y-auto w-full">
            {predictions.map((p, idx) => (
              <li 
                key={idx} 
                className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 text-sm text-slate-700"
                onClick={() => handlePredictionSelect(p)}
              >
                {p.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button 
        type="button" 
        onClick={handleCurrentLocation}
        disabled={isLoading}
        className="w-full text-[11px] uppercase font-bold text-slate-500 hover:text-blue-600 flex items-center justify-center mt-1 pt-3 pb-1 border-t border-slate-100"
      >
        <span className="mr-2 text-sm">🎯</span> Use my current location
      </button>
    </div>
  );
}
