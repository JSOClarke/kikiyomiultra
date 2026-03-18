import { useNavigate } from 'react-router-dom';
import { MangaBook } from '../../types';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useStore } from '../../store/useStore';
import { MangaCanvas } from './MangaCanvas';
import { MangaSettingsModal } from './MangaSettingsModal';
import { ChevronLeft, ChevronRight, X, Settings } from 'lucide-react';

interface MangaPlayerLayoutProps {
  book: MangaBook;
}

export const MangaPlayerLayout: React.FC<MangaPlayerLayoutProps> = ({ book }) => {
  const navigate = useNavigate();
  const activeIndex = usePlayerStore(state => state.activeIndex);
  const setActiveIndex = usePlayerStore(state => state.setActiveIndex);
  const openModal = useStore(state => state.openModal);

  // Fallback defaults
  const pages = book.mangaPages || [];
  const currentPage = pages[activeIndex];
  const totalPages = pages.length;

  const handleNextPage = () => {
    if (activeIndex < totalPages - 1) setActiveIndex(activeIndex + 1);
  };

  const handlePrevPage = () => {
    if (activeIndex > 0) setActiveIndex(activeIndex - 1);
  };

  // Ensure DOM captures localized clicks logically mimicking Japanese RTL layouts
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If the click is on the left 30% of the screen, go NEXT (RTL reading)
    // If the click is on the right 30% of the screen, go PREV
    const { clientX } = e;
    const { innerWidth } = window;
    
    if (clientX < innerWidth * 0.3) {
      handleNextPage(); // Left side click = Next Page
    } else if (clientX > innerWidth * 0.7) {
      handlePrevPage(); // Right side click = Previous page
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-[100] animate-in fade-in duration-300">
      
      {/* Top Header Controls */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 z-50 pointer-events-none">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-sec hover:text-bg text-white border border-white/10 flex items-center justify-center transition-colors pointer-events-auto backdrop-blur-md"
            >
               <X size={20} />
            </button>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm drop-shadow-md">{book.title}</span>
              <span className="text-white/60 font-mono text-[0.65rem] tracking-widest uppercase">Manga Reader</span>
            </div>
         </div>
         
         <div className="flex gap-2 items-center">
             <button 
               onClick={(e) => { e.stopPropagation(); openModal('isMangaSettingsOpen'); }}
               className="w-10 h-10 rounded-full bg-black/50 hover:bg-sec hover:text-bg border border-white/10 flex items-center justify-center text-white transition-colors pointer-events-auto backdrop-blur-md"
             >
                <Settings size={18} />
             </button>
             <div className="px-4 py-1.5 rounded-full bg-black/50 border border-white/10 text-white font-mono text-xs font-bold pointer-events-auto backdrop-blur-md text-sec truncate">
                {activeIndex + 1} / {totalPages || '?'}
             </div>
         </div>
      </div>

      {/* Main Structural Viewport */}
      <div 
         className="flex-1 w-full h-full cursor-pointer relative overflow-y-auto overflow-x-hidden" 
         onClick={handleCanvasClick}
      >
         <MangaCanvas page={currentPage} />
      </div>

      {/* Floating Left/Right Injectors (Visible hints for mouse users) */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none">
         <button 
            onClick={(e) => { e.stopPropagation(); handleNextPage(); }}
            disabled={activeIndex >= totalPages - 1}
            className="w-12 h-12 rounded-full bg-black/30 hover:bg-sec hover:text-bg border border-white/10 flex items-center justify-center text-white disabled:opacity-0 transition-all pointer-events-auto backdrop-blur-sm shadow-xl"
         >
            <ChevronLeft size={24} />
         </button>
      </div>

      <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none">
         <button 
            onClick={(e) => { e.stopPropagation(); handlePrevPage(); }}
            disabled={activeIndex === 0}
            className="w-12 h-12 rounded-full bg-black/30 hover:bg-sec hover:text-bg border border-white/10 flex items-center justify-center text-white disabled:opacity-0 transition-all pointer-events-auto backdrop-blur-sm shadow-xl"
         >
            <ChevronRight size={24} />
         </button>
      </div>

      {/* Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 z-50">
         <div 
           className="h-full bg-sec transition-all duration-300 shadow-[0_0_10px_rgba(var(--sec),0.8)]"
           style={{ width: `${((activeIndex + 1) / totalPages) * 100}%` }}
         />
      </div>

      {/* Global Modals */}
      <MangaSettingsModal />
    </div>
  );
};
