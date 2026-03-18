import React, { useRef, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { SubtitleList } from '../components/player/SubtitleList';
import { AudioControls } from '../components/player/AudioControls';
import { TextControls } from '../components/player/TextControls';
import { ChapterSidebar } from '../components/player/ChapterSidebar';
import { FocusMode } from '../components/player/FocusMode';
import { MangaPlayerLayout } from '../components/player/MangaPlayerLayout';
import { usePlayerStore } from '../store/usePlayerStore';
import { useStore } from '../store/useStore';

export const PlayerPage: React.FC = () => {
  const isFocusMode = useStore((state) => state.isFocusMode);
  const isChaptersOpen = false; // Mock state
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const activeBook = usePlayerStore(state => state.activeBook);
  const setAudioRef = usePlayerStore(state => state.setAudioRef);
  const updateCurrentTime = usePlayerStore(state => state.updateCurrentTime);
  const setIsPlaying = usePlayerStore(state => state.setIsPlaying);
  const setDuration = usePlayerStore(state => state.setDuration);
  const isTokenNavMode = usePlayerStore(state => state.isTokenNavMode);

  useEffect(() => {
    if (audioRef.current) {
      setAudioRef(audioRef.current);
      // Hydrate the audio timeline from the restored IDB store
      const state = usePlayerStore.getState();
      const restoredTime = state.currentTime;
      if (restoredTime > 0) {
        audioRef.current.currentTime = restoredTime;
        // Force an immediate time update to lock the activeIndex to the correct subtitle on load
        state.updateCurrentTime(restoredTime);
      }
    }
  }, [setAudioRef]);

  // Global Keyboard Controls for Reader Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input (future proofing)
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault(); // prevent page scroll
          usePlayerStore.getState().togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          usePlayerStore.getState().skipToNextSubtitle();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          usePlayerStore.getState().skipToPreviousSubtitle();
          break;
        case 'KeyF':
          e.preventDefault();
          useStore.getState().toggleFocusMode();
          break;
        case 'KeyN':
          e.preventDefault();
          usePlayerStore.getState().toggleTokenNavMode();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global wheel listener removed. Scroll wheel navigation is now strictly bound to the SubtitleList
  // internal container to prevent native-scroll competition and allow e.preventDefault().

  return (
    <>
      {activeBook?.type === 'manga' ? (
        <MangaPlayerLayout book={activeBook} />
      ) : (
        <>
          {/* Hidden Audio Engine - Only render if we have an audio URL */}
          {activeBook?.type === 'audiobook' && activeBook.audioUrl && (
            <audio
              ref={audioRef}
              src={activeBook.audioUrl}
          preload="auto"
          onTimeUpdate={(e) => updateCurrentTime((e.target as HTMLAudioElement).currentTime)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      <PageContainer scrollable={false}>
        {isTokenNavMode && (
          <div className="absolute top-4 right-4 z-50 bg-primary/20 text-primary border border-primary/30 px-3 py-1 text-xs font-bold rounded-full tracking-wider shadow-sm animate-in fade-in zoom-in duration-300 pointer-events-none">
            TOKEN NAV (N)
          </div>
        )}
        <div className={`relative flex-1 w-full flex flex-col overflow-hidden ${activeBook?.type === 'audiobook' ? 'pb-[150px]' : 'pb-[100px]'}`}>
          <SubtitleList />
          {isChaptersOpen && <ChapterSidebar />}
        </div>
      </PageContainer>
      
      {activeBook?.type === 'audiobook' ? <AudioControls /> : <TextControls />}

          {isFocusMode && <FocusMode />}
        </>
      )}
    </>
  );
}
