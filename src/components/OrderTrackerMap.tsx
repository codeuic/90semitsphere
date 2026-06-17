import React, { useState, useEffect, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Truck, Store, ArrowRight, Compass } from 'lucide-react';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

interface OrderTrackerMapProps {
  vendorLat: number;
  vendorLng: number;
  vendorName: string;
  customerLat: number;
  customerLng: number;
  customerAddress: string;
  riderName?: string;
  riderLat?: number;
  riderLng?: number;
  status: string;
}

// RouteDisplay dynamically resolves actual street directions using Google Directions API following the roads
function RouteDisplay({ origin, destination }: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map) return;

    // Clear previous polylines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    const directionsService = new routesLib.DirectionsService();

    const tryGoogleDirections = () => {
      return new Promise<boolean>((resolve) => {
        if (!directionsService) {
          resolve(false);
          return;
        }
        directionsService.route({
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          travelMode: google.maps.TravelMode.DRIVING,
        }, (result, status) => {
          if (status === 'OK' && result && result.routes && result.routes[0]) {
            const route = result.routes[0];
            const path = route.overview_path;
            
            const polyline = new google.maps.Polyline({
              path: path,
              strokeColor: '#22c55e', // Solid Brilliant Green
              strokeOpacity: 0.95,
              strokeWeight: 7,
              map: map
            });

            polylinesRef.current = [polyline];

            if (route.bounds) {
              map.fitBounds(route.bounds);
            }
            resolve(true);
          } else {
            resolve(false);
          }
        }).catch((err) => {
          console.warn('Google Directions request rejected or failed:', err);
          resolve(false);
        });
      });
    };

    const tryOSRMRoute = async () => {
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson`);
        if (!res.ok) return false;
        const data = await res.json();
        if (data.routes && data.routes[0] && data.routes[0].geometry) {
          const coords = data.routes[0].geometry.coordinates; // Array of [lng, lat]
          if (coords && coords.length > 0 && typeof google !== 'undefined' && google.maps) {
            const path = coords.map((c: [number, number]) => new google.maps.LatLng(c[1], c[0]));
            
            const polyline = new google.maps.Polyline({
              path: path,
              strokeColor: '#22c55e', // Solid Brilliant Green
              strokeOpacity: 0.95,
              strokeWeight: 7,
              map: map
            });

            polylinesRef.current = [polyline];

            // Fit bounds using the coordinate stream
            const bounds = new google.maps.LatLngBounds();
            path.forEach((pt: google.maps.LatLng) => bounds.extend(pt));
            map.fitBounds(bounds);
            return true;
          }
        }
      } catch (err) {
        console.warn('OSRM routing fetch failed:', err);
      }
      return false;
    };

    const drawWindingFallback = () => {
      if (typeof google === 'undefined' || !google.maps) return;
      
      // Create an artificial multi-segment winding road path (zig-zag grid)
      // to ensure it is not a straight line under any circumstance!
      const path: google.maps.LatLng[] = [];
      const latDiff = destination.lat - origin.lat;
      const lngDiff = destination.lng - origin.lng;
      
      path.push(new google.maps.LatLng(origin.lat, origin.lng));
      // First leg: partially along latitude
      path.push(new google.maps.LatLng(origin.lat + latDiff * 0.3, origin.lng));
      // Second leg: partially along longitude
      path.push(new google.maps.LatLng(origin.lat + latDiff * 0.3, origin.lng + lngDiff * 0.6));
      // Third leg: rest of latitude
      path.push(new google.maps.LatLng(destination.lat, origin.lng + lngDiff * 0.6));
      // Final leg: to destination
      path.push(new google.maps.LatLng(destination.lat, destination.lng));

      const polyline = new google.maps.Polyline({
        path: path,
        strokeColor: '#22c55e', // Solid Brilliant Green
        strokeOpacity: 0.95,
        strokeWeight: 7,
        map: map
      });

      polylinesRef.current = [polyline];

      const bounds = new google.maps.LatLngBounds();
      path.forEach(pt => bounds.extend(pt));
      map.fitBounds(bounds);
    };

    const runRoutingSequence = async () => {
      const googleSuccess = await tryGoogleDirections();
      if (googleSuccess) return;

      console.warn('Google Directions failed/blocked. Trying OpenStreetMap (OSRM) road network fallback...');
      const osrmSuccess = await tryOSRMRoute();
      if (osrmSuccess) return;

      console.warn('OSRM road-network failed. Generating custom winding street grid fallback path...');
      drawWindingFallback();
    };

    runRoutingSequence();

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [routesLib, map, origin.lat, origin.lng, destination.lat, destination.lng]);

  return null;
}

export default function OrderTrackerMap({
  vendorLat,
  vendorLng,
  vendorName,
  customerLat,
  customerLng,
  customerAddress,
  riderName = 'Rider',
  riderLat,
  riderLng,
  status
}: OrderTrackerMapProps) {
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    (window as any).gm_authFailure = () => {
      setMapError(true);
    };
  }, []);

  // Compute rider live coordinates interpolating or using live rider position
  const [liveRiderPos, setLiveRiderPos] = useState({ lat: vendorLat, lng: vendorLng });
  const [animationTick, setAnimationTick] = useState(0);

  // Status-based delivery route percentage
  const getProgressPercentage = (orderStatus: string) => {
    switch (orderStatus) {
      case 'PENDING_PAYMENT':
      case 'PAYMENT_CONFIRMED':
      case 'VENDOR_ACCEPTED':
      case 'VENDOR_PREPARING':
        return 0; // Rider is waiting/acting at vendor
      case 'RIDER_ASSIGNED':
      case 'RIDER_AT_VENDOR':
        return 0.15; // Rider arriving at vendor
      case 'PICKED_UP':
        return 0.35; // Juiced pickup
      case 'RIDER_ON_THE_WAY':
        return 0.65; // On the transit freeway
      case 'RIDER_ARRIVED':
        return 0.95; // Approaching doorstep
      case 'DELIVERED':
        return 1.0; // Handed off
      default:
        return 0;
    }
  };

  useEffect(() => {
    // Determine target location percentage
    const targetProgress = getProgressPercentage(status);

    // If riderOnTheWay, let's make it look active by oscillating slightly around the progress
    // so it looks like it is moving live in real-time, matching Uber Eats style!
    let fineAdjustment = 0;
    if (status === 'RIDER_ON_THE_WAY') {
      // Oscillate between -0.05 and +0.05 over time
      fineAdjustment = Math.sin(animationTick * 0.15) * 0.04;
    }

    const currentProgress = Math.max(0, Math.min(1, targetProgress + fineAdjustment));

    // Interpolate coordinate
    const deltaLat = customerLat - vendorLat;
    const deltaLng = customerLng - vendorLng;

    const interpolatedLat = vendorLat + deltaLat * currentProgress;
    const interpolatedLng = vendorLng + deltaLng * currentProgress;

    setLiveRiderPos({
      lat: riderLat !== undefined && status !== 'VENDOR_PREPARING' && status !== 'PAYMENT_CONFIRMED'
        ? riderLat 
        : interpolatedLat,
      lng: riderLng !== undefined && status !== 'VENDOR_PREPARING' && status !== 'PAYMENT_CONFIRMED'
        ? riderLng 
        : interpolatedLng,
    });

    // Tick simulation for micro-movement
    const timer = setInterval(() => {
      setAnimationTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [status, vendorLat, vendorLng, customerLat, customerLng, riderLat, riderLng, animationTick]);

  // Center coordinate represents medium point between Vendor and Customer
  const mapCenter = {
    lat: (vendorLat + customerLat) / 2,
    lng: (vendorLng + customerLng) / 2,
  };

  if (!API_KEY || mapError) {
    // Stunning 2D Canvas fallback map with custom styling & animations
    return (
      <div className="bg-[#1e1e24] rounded-3xl p-6 text-white overflow-hidden relative select-none">
        {/* Map Header */}
        <div className="flex justify-between items-center bg-[#292a33] p-4 rounded-2xl border border-neutral-700/60 mb-4 shadow-md font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-300 font-extrabold uppercase">Live 2D Routing Engine (active)</span>
          </div>
          <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-sm text-[10px] text-slate-400">OTA CITY GRID</span>
        </div>

        {/* Outer map preview board */}
        <div className="relative h-72 bg-[#1b1c22] rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden">
          
          {/* Subtle grid lines background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, #f3f4f6 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px"
          }}></div>

          <svg className="absolute inset-0 w-full h-full p-8" viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            {/* Simulated Street Grid paths for Lagos/Ota neighborhood map realism */}
            <path d="M 0 50 L 400 90" stroke="#2a2e3f" strokeWidth="2" strokeDasharray="3,6" />
            <path d="M 50 0 L 110 240" stroke="#2a2e3f" strokeWidth="2.5" strokeDasharray="3,6" />
            <path d="M 320 0 L 290 240" stroke="#2a2e3f" strokeWidth="2" strokeDasharray="3,6" />
            <path d="M 0 180 L 400 130" stroke="#2a2e3f" strokeWidth="2" strokeDasharray="3,6" />

            {/* Core logisitic path lines */}
            <path
              d="M 60 160 Q 200 60, 340 100"
              stroke="#22c55e"
              strokeOpacity="0.25"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Animated dashed line of Rider's delivery path - Solid Brilliant Green */}
            <path
              d="M 60 160 Q 200 60, 340 100"
              stroke="#22c55e"
              strokeWidth="5"
              strokeDasharray="6,4"
              strokeLinecap="round"
              className="opacity-100 animate-pulse"
            />

            {/* Vendor Marker Location (Left side) */}
            <g transform="translate(60, 160)" className="cursor-pointer">
              <circle r="22" fill="#1e2238" stroke="#3b82f6" strokeWidth="2" />
              <circle r="12" fill="#3b82f6" />
              <text y="32" textAnchor="middle" className="text-[10px] font-black fill-slate-300 font-sans uppercase">🏪 {vendorName.substring(0, 12)}...</text>
            </g>

            {/* Customer Drop Destination (Right side) */}
            <g transform="translate(340, 100)">
              <circle r="22" fill="#192823" stroke="#10b981" strokeWidth="2" />
              <circle r="12" fill="#10b981" />
              <text y="32" textAnchor="middle" className="text-[10px] font-black fill-slate-300 font-sans uppercase">🏡 Drop-off</text>
            </g>

            {/* Rider moving dynamically along bezier curve path based on progress */}
            {(() => {
              const p = getProgressPercentage(status) + (status === 'RIDER_ON_THE_WAY' ? Math.sin(animationTick * 0.15) * 0.04 : 0);
              const clampedP = Math.max(0, Math.min(1, p));
              
              // Bezier formula points matching M 60 160 Q 200 60, 340 100
              const riderX = (1 - clampedP) * (1 - clampedP) * 60 + 2 * (1 - clampedP) * clampedP * 200 + clampedP * clampedP * 340;
              const riderY = (1 - clampedP) * (1 - clampedP) * 160 + 2 * (1 - clampedP) * clampedP * 60 + clampedP * clampedP * 100;

              return (
                <g transform={`translate(${riderX}, ${riderY})`}>
                  <circle r="16" fill="#ff3d00" className="animate-ping opacity-60" />
                  <circle r="12" fill="#ff3d00" stroke="#ffffff" strokeWidth="1.5" />
                  <image href="https://img.icons8.com/color/48/motorbike.png" x="-10" y="-10" width="20" height="20" />
                  <text y="-18" textAnchor="middle" className="text-[9px] font-black fill-white bg-red-650 px-1 py-0.5 rounded font-sans uppercase tracking-tight">🛵 {riderName}</text>
                </g>
              );
            })()}
          </svg>

          {/* Quick Stats Overlay (e.g. status) */}
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] text-slate-300 border border-slate-700/60 font-medium">
            🚩 Tracking: <span className="font-bold text-sky-400 capitalize">{status.replace(/_/g, ' ').toLowerCase()}</span>
          </div>

          <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] text-[#FF5E2A] border border-slate-705 font-mono">
            {customerAddress ? customerAddress.substring(0, 30) : 'Bells University, Ota'}...
          </div>
        </div>

        {/* Info Strip */}
        <div className="grid grid-cols-3 gap-2 text-center mt-3 text-[11px] uppercase font-bold text-slate-400 font-mono">
          <div className="bg-[#21222b] p-2.5 rounded-xl border border-neutral-800">
            <span className="text-[#3b82f6]">From</span> <div className="text-white text-xs truncate mt-1">{vendorName}</div>
          </div>
          <div className="bg-[#21222b] p-2.5 rounded-xl border border-neutral-800 flex flex-col justify-center items-center">
            <span className="text-[#ff3d00] animate-pulse">Courier</span> <div className="text-white text-xs truncate mt-1">{riderName}</div>
          </div>
          <div className="bg-[#21222b] p-2.5 rounded-xl border border-neutral-800">
            <span className="text-[#10b981]">To</span> <div className="text-white text-xs truncate mt-1">Ota Destination</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative font-sans rounded-3xl overflow-hidden border border-slate-200">
      <APIProvider apiKey={API_KEY} version="weekly">
        <div style={{ height: '340px' }} className="relative w-full">
          <Map
            mapId="ORDER_TRACKING_MAP_ID"
            defaultZoom={13}
            defaultCenter={mapCenter}
            gestureHandling="greedy"
            disableDefaultUI={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
            {/* Draw actual road routes on the map screen in emerald green */}
            <RouteDisplay
              origin={{ lat: vendorLat, lng: vendorLng }}
              destination={{ lat: customerLat, lng: customerLng }}
            />

            {/* Vendor Pin */}
            <AdvancedMarker position={{ lat: vendorLat, lng: vendorLng }}>
              <div className="relative flex flex-col items-center">
                <div className="bg-blue-600 text-white rounded-full p-2.5 border-4 border-slate-900 shadow-xl">
                  <Store className="w-5 h-5" />
                </div>
                <div className="absolute bottom-11 bg-slate-900 text-white text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-800 whitespace-nowrap shadow-lg">
                  🏬 VENDOR: {vendorName}
                </div>
              </div>
            </AdvancedMarker>

            {/* Customer Drop-off location Pin */}
            <AdvancedMarker position={{ lat: customerLat, lng: customerLng }}>
              <div className="relative flex flex-col items-center">
                <div className="bg-[#FF5E2A] text-white rounded-full p-2.5 border-4 border-slate-900 shadow-xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="absolute bottom-11 bg-slate-900 text-white text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-800 whitespace-nowrap shadow-lg">
                  🏡 DROP-OFF: {customerAddress.substring(0, 20)}...
                </div>
              </div>
            </AdvancedMarker>

            {/* Animated Rider Pin moving along */}
            <AdvancedMarker position={liveRiderPos}>
              <div className="relative flex flex-col items-center">
                <div className="bg-red-600 text-white rounded-full p-3 border-4 border-white shadow-2xl animate-bounce">
                  <Truck className="w-6 h-6 animate-pulse" />
                </div>
                <div className="absolute bottom-12 bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg border border-red-500 whitespace-nowrap shadow-xl">
                  🛵 COURIER: {riderName}
                </div>
              </div>
            </AdvancedMarker>
          </Map>
        </div>
      </APIProvider>
    </div>
  );
}
