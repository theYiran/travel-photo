import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  Map, 
  Image, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Calendar,
  MapPin,
  Trash2,
  Maximize2
} from 'lucide-react';
import { Photo } from './types';
import { PhotoMap } from './components/PhotoMap';
import { Uploader } from './components/Uploader';
import { format } from 'date-fns';

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pendingPhotoId, setPendingPhotoId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (selectedPhotoId) {
      setIsSidebarOpen(false);
    }
  }, [selectedPhotoId]);

  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => a.timestamp - b.timestamp);
  }, [photos]);

  const selectedPhoto = useMemo(() => {
    return photos.find(p => p.id === selectedPhotoId) || null;
  }, [photos, selectedPhotoId]);

  const currentIndex = useMemo(() => {
    return sortedPhotos.findIndex(p => p.id === selectedPhotoId);
  }, [sortedPhotos, selectedPhotoId]);

  const nextPhoto = () => {
    if (currentIndex < sortedPhotos.length - 1) {
      setSelectedPhotoId(sortedPhotos[currentIndex + 1].id);
    }
  };

  const prevPhoto = () => {
    if (currentIndex > 0) {
      setSelectedPhotoId(sortedPhotos[currentIndex - 1].id);
    }
  };

  const addPhotos = (newPhotos: Photo[]) => {
    setPhotos(prev => [...prev, ...newPhotos]);
    const firstNoLoc = newPhotos.find(p => p.lat === null);
    if (firstNoLoc) {
      setPendingPhotoId(firstNoLoc.id);
      setIsPickingLocation(true);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    if (pendingPhotoId) {
      setPhotos(prev => prev.map(p => 
        p.id === pendingPhotoId ? { ...p, lat, lng } : p
      ));
      
      const remaining = photos.filter(p => p.lat === null && p.id !== pendingPhotoId);
      if (remaining.length > 0) {
        setPendingPhotoId(remaining[0].id);
      } else {
        setPendingPhotoId(null);
        setIsPickingLocation(false);
      }
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    if (selectedPhotoId === id) setSelectedPhotoId(null);
  };

  return (
    <div className="flex h-screen w-full bg-black overflow-hidden">
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 400 : 0 }}
        className="relative h-full glass-panel z-20 overflow-hidden flex flex-col"
      >
        <div className="p-8 flex flex-col h-full w-[400px]">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Compass className="w-6 h-6 text-white" />
              <h1 className="text-2xl font-serif italic tracking-wide">Wanderlust</h1>
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-medium">
              Your Journey, Visualized
            </p>
          </header>

          <Uploader onPhotosAdded={addPhotos} />

          <div className="flex-1 overflow-y-auto no-scrollbar mt-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xs uppercase tracking-widest text-white/60 font-semibold">
                Timeline ({photos.length})
              </h2>
            </div>

            <div className="space-y-3">
              {sortedPhotos.map((photo) => (
                <motion.div
                  key={photo.id}
                  layoutId={photo.id}
                  onClick={() => setSelectedPhotoId(photo.id)}
                  className={`
                    group relative flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300
                    ${selectedPhotoId === photo.id ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'}
                  `}
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={photo.url} className="w-full h-full object-cover" />
                    {photo.lat === null && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-red-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white/90">{photo.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3 text-white/30" />
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">
                        {format(photo.timestamp, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.aside>

      <main className="flex-1 relative bg-[#050505]">
        {/* Background Layer: Photo or Map */}
        <AnimatePresence mode="wait">
          {selectedPhoto ? (
            <motion.div
              key={selectedPhoto.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-0"
            >
              <img 
                src={selectedPhoto.url} 
                className="w-full h-full object-cover" 
                alt={selectedPhoto.name}
              />
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
            </motion.div>
          ) : (
            <motion.div
              key="map-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-0"
            >
              <PhotoMap 
                photos={photos} 
                selectedPhoto={selectedPhoto}
                onPhotoSelect={(p) => setSelectedPhotoId(p.id)}
                onLocationSelect={handleLocationSelect}
                isPickingLocation={isPickingLocation}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay Layer: Transparent Map showing path when photo is selected */}
        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 pointer-events-none"
            >
              <PhotoMap 
                photos={photos} 
                selectedPhoto={selectedPhoto}
                onPhotoSelect={() => {}} // Disabled in overlay
                onLocationSelect={() => {}} // Disabled in overlay
                isPickingLocation={false}
                transparentMap={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mini Map Pop-up (Optional, maybe remove if we have the overlay?) 
            Actually the user said "make the map pop up on top". 
            Maybe they meant the mini map I already added? 
            "Make the map transparent, only display my path." 
            This sounds like the overlay.
        */}

        <AnimatePresence>
          {!selectedPhoto && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute top-8 left-8 z-[1000] flex flex-col gap-4"
            >
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"
              >
                {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-2xl px-6"
            >
              <div className="glass-panel rounded-xl overflow-hidden shadow-2xl border border-white/5 backdrop-blur-3xl bg-black/20">
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between gap-8">
                    <div className="flex-1">
                      <motion.h3 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-lg font-serif italic mb-0.5 text-white/90"
                      >
                        {selectedPhoto.name}
                      </motion.h3>
                      <div className="flex items-center gap-4 text-white/40 text-[9px] uppercase tracking-[0.2em] font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {format(selectedPhoto.timestamp, 'MMM dd, yyyy')}
                        </span>
                        <div className="flex items-center gap-2 group/loc">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {selectedPhoto.lat ? `${selectedPhoto.lat.toFixed(3)}°, ${selectedPhoto.lng?.toFixed(3)}°` : 'No Location'}
                          </span>
                          <button 
                            onClick={() => {
                              setPendingPhotoId(selectedPhoto.id);
                              setIsPickingLocation(true);
                            }}
                            className="text-[8px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/60 transition-colors border border-white/5"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1.5">
                      <button 
                        onClick={prevPhoto}
                        disabled={currentIndex === 0}
                        className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-10 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={nextPhoto}
                        disabled={currentIndex === sortedPhotos.length - 1}
                        className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-10 transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedPhotoId(null)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-xl border border-white/5 flex items-center justify-center transition-all"
                >
                  <Plus className="w-3.5 h-3.5 rotate-45" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {photos.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center mx-auto bg-white/5">
                <Image className="w-8 h-8 text-white/20" />
              </div>
              <h2 className="text-3xl font-serif italic text-white/40">No memories yet</h2>
              <p className="text-white/20 text-sm tracking-widest uppercase">Upload photos to begin your journey</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
