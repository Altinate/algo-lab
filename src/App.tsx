import React, { useState, useEffect } from 'react';
import { useHashEngine } from './hooks/useHashEngine';
import { usePlayback } from './hooks/usePlayback';
import AlgorithmSelector from './components/AlgorithmSelector';
import InputPanel from './components/InputPanel';
import PlaybackControls from './components/PlaybackControls';
import StepVisualizer from './components/StepVisualizer';
import HashOutput from './components/HashOutput';
import AlgorithmInfoPanel from './components/AlgorithmInfo';

export default function App() {
  const engine = useHashEngine();
  const playback = usePlayback(engine.steps.length);

  // Persistent sidebar show/hide state
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('hash_sidebar_open');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('hash_sidebar_open', String(next));
      } catch {}
      return next;
    });
  };

  // Keyboard shortcut (Ctrl+B / Cmd+B) to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentStepData =
    engine.steps.length > 0 ? engine.steps[playback.currentStep] ?? null : null;

  const isComplete =
    engine.steps.length > 0 &&
    playback.currentStep === engine.steps.length - 1;

  const phases = getPhases(engine.steps);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col antialiased selection:bg-blue-500/30 selection:text-blue-200">
      {/* ─── Compact Top Header Bar ──────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between border-b border-gray-800/80 bg-gray-900/95 px-3 sm:px-4 backdrop-blur">
        {/* Left: Sidebar Toggle + Brand / Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sidebar Toggle Button */}
          <button
            onClick={toggleSidebar}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
              sidebarOpen
                ? 'border-gray-700 bg-gray-800 text-blue-400 hover:bg-gray-700'
                : 'border-blue-500/50 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 ring-1 ring-blue-500/30'
            }`}
            title={`${sidebarOpen ? 'Hide' : 'Show'} Sidebar (Ctrl+B)`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold text-sm shadow-sm">
            #
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-bold tracking-tight text-white hidden xs:inline-block">
              Hash Visualizer
            </h1>
            <span className="hidden md:inline-block rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-400 border border-gray-700">
              Interactive State Inspection
            </span>
          </div>
        </div>

        {/* Center/Right: Active Algorithm Badge & Quick Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {engine.algorithm && (
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-md bg-gray-800/80 px-2 sm:px-2.5 py-1 border border-gray-700/80 text-xs">
              <span className="text-gray-400 hidden sm:inline">Active:</span>
              <span className="font-bold text-blue-400 font-mono">
                {engine.algorithm.info.name}
              </span>
              <span className="text-[10px] text-gray-500">
                ({engine.algorithm.info.digestSize}b)
              </span>
            </div>
          )}

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400 bg-gray-800/40 px-2 py-1 rounded border border-gray-800 font-mono">
            <span className="text-gray-500">Steps:</span>
            <span className="font-bold text-yellow-400">
              {engine.steps.length > 0 ? `${playback.currentStep + 1}/${engine.steps.length}` : '0'}
            </span>
          </div>

          <a
            href="https://github.com/dmarman/sha256algorithm"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <span className="text-[10px] hidden sm:inline">Reference</span>
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </header>

      {/* ─── Two-Region App Layout: Sticky Sidebar + Fluid Width Main ───── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* ─── Left Sidebar: Collapsible with smooth transition ───────── */}
        <aside
          className={`shrink-0 bg-gray-900/70 flex flex-col h-[calc(100vh-3rem)] sticky top-12 overflow-y-auto transition-all duration-300 ease-in-out z-20 ${
            sidebarOpen
              ? 'w-64 xl:w-72 p-4 border-r border-gray-800 opacity-100 pointer-events-auto'
              : 'w-0 p-0 border-r-0 opacity-0 pointer-events-none overflow-hidden'
          }`}
        >
          {sidebarOpen && (
            <div className="space-y-5 min-w-[230px]">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800/80">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Navigation
                </span>
                <button
                  onClick={toggleSidebar}
                  className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
                  title="Collapse sidebar (Ctrl+B)"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              <AlgorithmSelector
                algorithmsByFamily={engine.algorithmsByFamily}
                selectedAlgorithm={engine.algorithmName}
                onSelect={engine.setAlgorithmName}
              />

              {engine.algorithm && (
                <div className="pt-3 border-t border-gray-800">
                  <AlgorithmInfoPanel info={engine.algorithm.info} />
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ─── Main Content: Fluid Width (Takes 100% remaining space) ─── */}
        <main className="flex-1 min-w-0 p-3 sm:p-5 overflow-y-auto space-y-4 transition-all duration-300">
          {/* Re-open Sidebar Floating Pill (when sidebar is hidden) */}
          {!sidebarOpen && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSidebar}
                className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/40 bg-blue-950/40 px-2.5 py-1 text-xs font-medium text-blue-300 hover:bg-blue-900/50 hover:text-white transition-all shadow-sm"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span>Show Algorithm Sidebar</span>
              </button>
            </div>
          )}

          {/* Top Panel: Input String + Live Hash Output */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 items-stretch">
            <InputPanel input={engine.input} onInputChange={engine.setInput} />

            <HashOutput
              digest={engine.digest}
              algorithmName={engine.algorithmName}
              digestSize={engine.algorithm?.info.digestSize ?? 0}
              isComplete={isComplete}
            />
          </div>

          {/* Transport Controls */}
          <PlaybackControls playback={playback} />

          {/* Phase Quick Jump Navigation */}
          {phases.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-gray-900/80 border border-gray-800 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mr-2">
                Phase Jump:
              </span>
              {phases.map(({ phase, startIndex }) => (
                <button
                  key={`${phase}-${startIndex}`}
                  onClick={() => playback.setCurrentStep(startIndex)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                    currentStepData?.phase === phase
                      ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700/70'
                  }`}
                >
                  {phase}
                </button>
              ))}
            </div>
          )}

          {/* Step Visualizer (Contains the 3-column persistent view expanding fluidly) */}
          <StepVisualizer
            step={currentStepData}
            currentStep={playback.currentStep}
            totalSteps={engine.steps.length}
          />
        </main>
      </div>
    </div>
  );
}

function getPhases(
  steps: { phase: string }[],
): { phase: string; startIndex: number }[] {
  const phases: { phase: string; startIndex: number }[] = [];
  let lastPhase = '';
  steps.forEach((step, index) => {
    if (step.phase !== lastPhase) {
      phases.push({ phase: step.phase, startIndex: index });
      lastPhase = step.phase;
    }
  });
  return phases;
}
