import React, { useMemo } from 'react';
import { Map, Marker, ZoomControl, Overlay } from 'pigeon-maps';
import { Photo } from '../types';

interface PhotoMapProps {
  photos: Photo[];
  selectedPhoto: Photo | null;
  onPhotoSelect: (photo: Photo) => void;
  onLocationSelect: (lat: number, lng: number) => void;
  isPickingLocation: boolean;
  isMiniMap?: boolean;
  transparentMap?: boolean;
}

// Custom component to draw the travel path
const TravelPath = ({ photos, latLngToPixel }: { photos: Photo[], latLngToPixel?: (latLng: [number, number]) => [number, number] }) => {
  if (!latLngToPixel || photos.length < 2) return null;

  const points = photos.map(p => latLngToPixel([p.lat!, p.lng!]));
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');

  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible z-0">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Outer Glow */}
      <path
        d={pathData}
        fill="none"
        stroke="rgba(255, 255, 255, 0.15)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />
      {/* Main Path */}
      <path
        d={pathData}
        fill="none"
        stroke="rgba(255, 255, 255, 0.6)"
        strokeWidth="2"
        strokeDasharray="8 12"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-[dash_30s_linear_infinite]"
      />
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -200;
          }
        }
      `}</style>
    </svg>
  );
};

export const PhotoMap: React.FC<PhotoMapProps> = ({ 
  photos, 
  selectedPhoto, 
  onPhotoSelect,
  onLocationSelect,
  isPickingLocation,
  isMiniMap = false,
  transparentMap = false
}) => {
  const photosWithLocation = useMemo(() => 
    photos.filter(p => p.lat !== null && p.lng !== null)
      .sort((a, b) => a.timestamp - b.timestamp)
  , [photos]);
  
  const center: [number, number] = useMemo(() => {
    if (selectedPhoto && selectedPhoto.lat !== null && selectedPhoto.lng !== null) {
      return isMiniMap ? [selectedPhoto.lat, selectedPhoto.lng] : [selectedPhoto.lat + 0.02, selectedPhoto.lng];
    }
    return [20, 0];
  }, [selectedPhoto, isMiniMap]);

  const transparentProvider = () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

  return (
    <div className={`w-full h-full relative ${transparentMap ? 'bg-transparent' : 'bg-[#050505]'} ${isMiniMap ? 'cursor-default' : ''}`}>
      <Map 
        height={undefined} 
        center={center} 
        defaultZoom={isMiniMap ? 10 : 3}
        animate={true}
        animateMaxScreens={3}
        provider={transparentMap ? transparentProvider : undefined}
        onClick={({ event, latLng, pixel }) => {
          if (isPickingLocation) {
            onLocationSelect(latLng[0], latLng[1]);
          }
        }}
      >
        {!isMiniMap && <ZoomControl />}
        
        {/* Travel Path */}
        <TravelPath photos={photosWithLocation} />

        {photosWithLocation.map((photo, index) => (
          <Marker 
            key={photo.id}
            {...({
              anchor: [photo.lat!, photo.lng!],
              onClick: () => onPhotoSelect(photo)
            } as any)}
          >
            <div className={`
              relative group cursor-pointer transition-all duration-500
              ${selectedPhoto?.id === photo.id ? 'z-50 scale-125' : 'z-10 hover:scale-110'}
              ${isMiniMap && selectedPhoto?.id !== photo.id ? 'opacity-40 scale-75' : ''}
            `}>
              <div className={`
                absolute -inset-4 rounded-full blur-2xl transition-opacity duration-700
                ${selectedPhoto?.id === photo.id ? 'bg-white/30 opacity-100' : 'bg-white/10 opacity-0 group-hover:opacity-100'}
              `} />
              
              <div className={`
                relative ${isMiniMap ? 'w-8 h-8 rounded-lg' : 'w-12 h-12 rounded-2xl'} border-2 overflow-hidden shadow-2xl transition-all duration-500
                ${selectedPhoto?.id === photo.id ? 'border-white ring-8 ring-white/10' : 'border-white/30 group-hover:border-white/60'}
              `}>
                <img src={photo.url} className="w-full h-full object-cover" />
                {!isMiniMap && (
                  <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-md text-[7px] font-bold px-1 py-0.5 rounded border border-white/10 text-white/90">
                    {index + 1}
                  </div>
                )}
              </div>

              <div className={`
                absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]
                ${selectedPhoto?.id === photo.id ? 'bg-white scale-150' : 'bg-white/40'}
              `} />
            </div>
          </Marker>
        ))}
      </Map>

      {!isMiniMap && <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_200px_rgba(0,0,0,0.9)]" />}

      {isPickingLocation && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[1000] glass-panel px-8 py-4 rounded-full flex items-center gap-4 border border-white/10 shadow-2xl backdrop-blur-3xl animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="relative">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute inset-0" />
            <div className="w-3 h-3 bg-red-500 rounded-full relative" />
          </div>
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/80">Select Location on Map</span>
        </div>
      )}
    </div>
  );
};
