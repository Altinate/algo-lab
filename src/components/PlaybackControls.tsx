import type { PlaybackState } from '../hooks/usePlayback';

interface PlaybackControlsProps {
  playback: PlaybackState;
}

export default function PlaybackControls({ playback }: PlaybackControlsProps) {
  const {
    currentStep,
    isPlaying,
    speed,
    totalSteps,
    next,
    prev,
    reset,
    goToEnd,
    togglePlay,
    setSpeed,
    setCurrentStep,
  } = playback;

  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const currentStepDisplay = totalSteps > 0 ? currentStep + 1 : 0;

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/80 px-3.5 py-2 shadow-sm space-y-2">
      {/* ─── Compact Inline Progress & Scrubber Bar ─────────────────────── */}
      <div className="flex items-center gap-3 font-mono text-xs">
        <div className="flex items-center gap-1.5 shrink-0 text-gray-400">
          <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-gray-500">
            Step
          </span>
          <span className="font-bold text-white text-xs">{currentStepDisplay}</span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400">{totalSteps}</span>
        </div>

        {/* Interactive Scrub Track */}
        <div className="relative flex-1 group flex items-center h-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800 group-hover:h-2 transition-all">
            <div
              className="h-full rounded-full bg-blue-500 group-hover:bg-blue-400 transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, totalSteps - 1)}
            value={currentStep}
            onChange={(e) => setCurrentStep(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={totalSteps === 0}
            title="Drag to scrub through steps"
          />
        </div>

        <span className="text-xs font-bold text-blue-400 shrink-0 min-w-[38px] text-right font-mono">
          {Math.round(progress)}%
        </span>
      </div>

      {/* ─── Transport Control Buttons ──────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-800/80">
        <div className="flex items-center gap-1">
          {/* Reset */}
          <button
            onClick={reset}
            disabled={totalSteps === 0 || currentStep === 0}
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed"
            title="Reset to start (Step 1)"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>

          {/* Previous */}
          <button
            onClick={prev}
            disabled={currentStep === 0 || totalSteps === 0}
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed"
            title="Previous step (←)"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            disabled={totalSteps === 0}
            className={`flex items-center justify-center rounded-md px-3 py-1 font-sans text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-25 disabled:cursor-not-allowed ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 ring-1 ring-amber-400/40'
                : 'bg-blue-600 hover:bg-blue-500 ring-1 ring-blue-400/40'
            }`}
            title={isPlaying ? 'Pause auto-play (Space)' : 'Start auto-play (Space)'}
          >
            {isPlaying ? (
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                Pause
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play
              </span>
            )}
          </button>

          {/* Next */}
          <button
            onClick={next}
            disabled={currentStep >= totalSteps - 1 || totalSteps === 0}
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed"
            title="Next step (→)"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Go to End */}
          <button
            onClick={goToEnd}
            disabled={totalSteps === 0 || currentStep >= totalSteps - 1}
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed"
            title="Skip to end"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Speed Control Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 font-medium">Speed:</span>
          <div className="flex items-center rounded border border-gray-700 bg-gray-800/80 p-0.5">
            {[
              { label: '0.5×', val: 1000 },
              { label: '1×', val: 500 },
              { label: '2×', val: 250 },
              { label: '5×', val: 100 },
              { label: '10×', val: 50 },
            ].map(({ label, val }) => (
              <button
                key={val}
                onClick={() => setSpeed(val)}
                className={`rounded px-1.5 py-0.5 text-[11px] font-mono transition-colors ${
                  speed === val
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
