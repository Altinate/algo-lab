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

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            Step {totalSteps > 0 ? currentStep + 1 : 0} of {totalSteps}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-blue-500 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Clickable progress track */}
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={currentStep}
          onChange={(e) => setCurrentStep(Number(e.target.value))}
          className="w-full accent-blue-500 h-1 opacity-0 cursor-pointer absolute"
          style={{ marginTop: '-14px' }}
          disabled={totalSteps === 0}
        />
      </div>

      {/* Transport controls */}
      <div className="flex items-center justify-center gap-2">
        {/* Reset */}
        <button
          onClick={reset}
          disabled={totalSteps === 0}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="Reset to start"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        {/* Previous */}
        <button
          onClick={prev}
          disabled={currentStep === 0 || totalSteps === 0}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous step"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          disabled={totalSteps === 0}
          className="rounded-xl bg-blue-600 p-3 text-white transition-colors hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Next */}
        <button
          onClick={next}
          disabled={currentStep >= totalSteps - 1 || totalSteps === 0}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next step"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Go to End */}
        <button
          onClick={goToEnd}
          disabled={totalSteps === 0}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="Skip to end"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>

        {/* Speed control */}
        <div className="ml-4 flex items-center gap-2">
          <label className="text-xs text-gray-500">Speed</label>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-300 focus:border-blue-500 focus:outline-none"
          >
            <option value={1000}>0.5×</option>
            <option value={500}>1×</option>
            <option value={250}>2×</option>
            <option value={100}>5×</option>
            <option value={50}>10×</option>
          </select>
        </div>
      </div>
    </div>
  );
}
