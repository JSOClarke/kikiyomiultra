import React from 'react';
import { useStore } from '../../store/useStore';

interface MangaOcrOverlayProps {
  blocks: any[];
  naturalWidth: number;
  naturalHeight: number;
}

export const MangaOcrOverlay: React.FC<MangaOcrOverlayProps> = ({ blocks, naturalWidth, naturalHeight }) => {
  const mangaFontSize = useStore(state => state.mangaFontSize);
  const mangaFontFamily = useStore(state => state.mangaFontFamily);

  if (!naturalWidth || !naturalHeight || !blocks || blocks.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {blocks.map((b, i) => {
        const [x_min, y_min, x_max, y_max] = b.box;
        
        // Mathematically project raw OCR coordinates onto a fluid CSS percentage map!
        const left = (x_min / naturalWidth) * 100;
        const top = (y_min / naturalHeight) * 100;
        const width = ((x_max - x_min) / naturalWidth) * 100;
        const height = ((y_max - y_min) / naturalHeight) * 100;
        
        // Flatten the Japanese sentences
        const lines = b.lines.join('');
        
        // Mokuro explicit structural bindings
        const isVertical = b.vertical !== undefined ? b.vertical : ((y_max - y_min) > (x_max - x_min));
        
        return (
          <div 
             key={i} 
             // group hover triggers the child opacity natively without JS
             className="absolute cursor-text group z-10" 
             style={{ 
               left: `${left}%`, 
               top: `${top}%`, 
               width: `${width}%`, 
               height: `${height}%`,
             }}
          >
             {/* The exact Mokuro White Box UI Implementation */}
             <div className="w-full h-full opacity-0 group-hover:opacity-100 bg-white pointer-events-auto transition-opacity duration-150 flex items-center justify-center p-1 rounded-sm shadow-xl overflow-visible">
                 <p 
                   className="text-black font-semibold text-center whitespace-pre-wrap select-text leading-snug"
                   style={{
                     writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
                     fontSize: `${mangaFontSize}px`,
                     fontFamily: mangaFontFamily
                   }}
                 >
                   {lines}
                 </p>
             </div>
          </div>
        );
      })}
    </div>
  );
};
