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
    <div className="rounded-[2px] border border-[#1f2937] bg-[#0c1017] px-3 py-1.5 space-y-1.5 font-mono">
      {/* ─── Compact Inline Progress & Scrubber Track ─────────────────────── */}
      <div className="flex items-center gap-3 text-xs tabular-nums">
        <div className="flex items-center gap-1.5 shrink-0 text-[#94a3b8]">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748b]">
            CYCLE
          </span>
          <span className="font-bold text-[#f8fafc] text-xs">
            {currentStepDisplay.toString().padStart(2, '0')}
          </span>
          <span className="text-[#475569]">/</span>
          <span className="text-[#64748b]">{totalSteps.toString().padStart(2, '0')}</span>
        </div>

        {/* Interactive Scrub Track */}
        <div className="relative flex-1 group flex items-center h-3.5">
          <div className="h-1 w-full overflow-hidden rounded-none bg-[#151c28] group-hover:h-1.5 transition-all">
            <div
              className="h-full rounded-none bg-[#38bdf8] transition-all duration-100"
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
            title="Scrub clock cycles"
          />
        </div>

        <span className="text-[11px] font-bold text-[#38bdf8] shrink-0 min-w-[36px] text-right">
          {Math.round(progress)}%
        </span>
      </div>

      {/* ─── Clock Transport Buttons & Speed Telemetry ────────────────────── */}
      <div className="flex items-center justify-between pt-1 border-t border-[#1f2937]">
        <div className="flex items-center gap-1">
          {/* Reset */}
          <button
            onClick={reset}
            disabled={totalSteps === 0 || currentStep === 0}
            className="rounded-[2px] p-1 text-[#94a3b8] hover:bg-[#151c27] hover:text-[#f8fafc] disabled:opacity-20 disabled:cursor-not-allowed transition-colors border border-transparent hover:border-[#1f2937]"
            title="Reset clock to cycle 0"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>

          {/* Previous */}
          <button
            onClick={prev}
            disabled={currentStep === 0 || totalSteps === 0}
            className="rounded-[2px] p-1 text-[#94a3b8] hover:bg-[#151c27] hover:text-[#f8fafc] disabled:opacity-20 disabled:cursor-not-allowed transition-colors border border-transparent hover:border-[#1f2937]"
            title="Single step back (←)"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Clock Step / Run */}
          <button
            onClick={togglePlay}
            disabled={totalSteps === 0}
            className={`flex items-center justify-center rounded-[2px] px-2.5 py-0.5 text-[11px] font-bold tracking-wider transition-all disabled:opacity-20 disabled:cursor-not-allowed border ${
              isPlaying
                ? 'bg-[#26180a] border-[#e5a93b]/60 text-[#e5a93b] phosphor-amber'
                : 'bg-[#0f1d2e] border-[#38bdf8]/60 text-[#38bdf8]'
            }`}
            title={isPlaying ? 'Halt Clock (Space)' : 'Run Clock (Space)'}
          >
            {isPlaying ? (
              <span className="flex items-center gap-1">
                <span>■</span>
                <span>HALT</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span>▶</span>
                <span>CLOCK</span>
              </span>
            )}
          </button>

          {/* Next */}
          <button
            onClick={next}
            disabled={currentStep >= totalSteps - 1 || totalSteps === 0}
            className="rounded-[2px] p-1 text-[#94a3b8] hover:bg-[#151c27] hover:text-[#f8fafc] disabled:opacity-20 disabled:cursor-not-allowed transition-colors border border-transparent hover:border-[#1f2937]"
            title="Single step forward (→)"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Skip to end */}
          <button
            onClick={goToEnd}
            disabled={totalSteps === 0 || currentStep >= totalSteps - 1}
            className="rounded-[2px] p-1 text-[#94a3b8] hover:bg-[#151c27] hover:text-[#f8fafc] disabled:opacity-20 disabled:cursor-not-allowed transition-colors border border-transparent hover:border-[#1f2937]"
            title="Skip to final digest"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Clock Frequency / Speed Control */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-[#64748b] uppercase">FREQ:</span>
          <div className="flex items-center rounded-[2px] border border-[#1f2937] bg-[#090c10] p-0.5">
            {[
              { label: '0.5x', val: 1000 },
              { label: '1x', val: 500 },
              { label: '2x', val: 250 },
              { label: '5x', val: 100 },
              { label: '10x', val: 50 },
            ].map(({ label, val }) => (
              <button
                key={val}
                onClick={() => setSpeed(val)}
                className={`rounded-[2px] px-1.5 py-0.2 text-[10px] tabular-nums transition-colors ${
                  speed === val
                    ? 'bg-[#152238] text-[#38bdf8] font-bold border border-[#38bdf8]/40'
                    : 'text-[#64748b] hover:text-[#94a3b8]'
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
