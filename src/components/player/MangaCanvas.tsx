import React, { useState } from 'react';
import { MangaPage } from '../../types';
import { MangaOcrOverlay } from './MangaOcrOverlay';
import { Loader2 } from 'lucide-react';

interface MangaCanvasProps {
  page: MangaPage | undefined;
}

export const MangaCanvas: React.FC<MangaCanvasProps> = ({ page }) => {
  const [naturalWidth, setNaturalWidth] = useState<number>(0);
  const [naturalHeight, setNaturalHeight] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Force loading spinner specifically when the target payload string changes
  React.useEffect(() => {
    setIsLoading(true);
  }, [page?.imageUrl]);

  if (!page) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
         <p>No valid manga structural data found.</p>
      </div>
    );
  }

  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    setNaturalWidth(target.naturalWidth);
    setNaturalHeight(target.naturalHeight);
    setIsLoading(false);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-2 md:p-6 bg-black">
       {/* Background structural loading wrapper isolating image popping */}
       {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 backdrop-blur-sm">
             <Loader2 size={48} className="text-sec animate-spin opacity-80" />
          </div>
       )}

       {/* The Mathematical Scale Container */}
       <div className="relative max-w-full max-h-full inline-flex shadow-[0_0_25px_rgba(0,0,0,0.8)]">
          <img 
            src={page.imageUrl} 
            onLoad={handleImageLoaded}
            // Keep object containment rigorous so CSS overlays bind physically zero-overflow
            className="block max-w-full max-h-[90vh] md:max-h-[95vh] w-auto h-auto object-contain rounded-md select-none transition-opacity duration-300"
            style={{ opacity: isLoading ? 0 : 1 }}
            alt="Manga Payload" 
          />
          
          {/* Inject Dynamic Coordinates mapping transparent layer if extraction engine successfully parsed data */}
          {!isLoading && page.ocrBlocks && page.ocrBlocks.length > 0 && (
            <MangaOcrOverlay 
               blocks={page.ocrBlocks} 
               naturalWidth={naturalWidth} 
               naturalHeight={naturalHeight} 
            />
          )}
       </div>
    </div>
  );
}
