import React, { useState, useEffect } from 'react';
import { useHashEngine } from './hooks/useHashEngine';
import { usePlayback } from './hooks/usePlayback';
import AlgorithmSelector from './components/AlgorithmSelector';
import InputPanel from './components/InputPanel';
import CipherInputPanel from './components/CipherInputPanel';
import PlaybackControls from './components/PlaybackControls';
import StepVisualizer from './components/StepVisualizer';
import HashOutput from './components/HashOutput';
import CipherOutput from './components/CipherOutput';
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
    <div className="min-h-screen bg-[#090c10] text-[#f8fafc] flex flex-col font-mono antialiased">
      {/* ─── Top Telemetry Header Bar ────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex flex-wrap h-auto min-h-10 shrink-0 items-center justify-between border-b border-[#1f2937] bg-[#0c1017] px-3 sm:px-4 py-1 gap-2">
        {/* Left: Sidebar Toggle + Instrument Title + Domain Tabs */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={toggleSidebar}
            className={`flex h-6 w-6 items-center justify-center rounded-[2px] border transition-all text-xs font-medium ${
              sidebarOpen
                ? 'border-[#1f2937] bg-[#121620] text-[#38bdf8] hover:bg-[#1a2232]'
                : 'border-[#38bdf8]/50 bg-[#0f1d2e] text-[#38bdf8] hover:bg-[#152238] ring-1 ring-[#38bdf8]/40'
            }`}
            title={`${sidebarOpen ? 'Collapse' : 'Expand'} Sidebar (Ctrl+B)`}
          >
            <span>{sidebarOpen ? '«' : '»'}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-[#38bdf8]" />
            <h1 className="text-xs font-semibold tracking-tight text-white uppercase">
              CRYPTOSCOPE
            </h1>
            <span className="hidden md:inline-block text-[9px] text-[#64748b] border-l border-[#1f2937] pl-2 uppercase font-medium">
              INTERACTIVE CRYPTOGRAPHIC LOGIC ANALYZER
            </span>
          </div>

          {/* ─── Top-Level Domain Switcher Tabs ─────────────────────────── */}
          <div className="flex items-center gap-1 border-l border-[#1f2937] pl-2">
            <button
              onClick={() => engine.setCategory('hash')}
              className={`rounded-[2px] px-2 py-0.5 text-[9px] font-bold uppercase transition-all flex items-center gap-1 ${
                engine.category === 'hash'
                  ? 'bg-[#152238] text-[#38bdf8] border border-[#38bdf8]/60 shadow-[0_0_8px_rgba(56,189,248,0.15)]'
                  : 'bg-[#0e131b] text-[#64748b] hover:text-[#cbd5e1] border border-[#1f2937]'
              }`}
            >
              <span>⌗</span>
              <span>HASH FUNCTIONS (34)</span>
            </button>

            <button
              onClick={() => engine.setCategory('symmetric')}
              className={`rounded-[2px] px-2 py-0.5 text-[9px] font-bold uppercase transition-all flex items-center gap-1 ${
                engine.category === 'symmetric'
                  ? 'bg-[#152238] text-[#34d399] border border-[#34d399]/60 shadow-[0_0_8px_rgba(52,211,153,0.15)]'
                  : 'bg-[#0e131b] text-[#64748b] hover:text-[#cbd5e1] border border-[#1f2937]'
              }`}
            >
              <span>🔒</span>
              <span>SYMMETRIC CIPHERS (34)</span>
            </button>

            <button
              onClick={() => engine.setCategory('asymmetric')}
              className={`rounded-[2px] px-2 py-0.5 text-[9px] font-bold uppercase transition-all flex items-center gap-1 ${
                engine.category === 'asymmetric'
                  ? 'bg-[#1a1224] text-[#c084fc] border border-[#c084fc]/60 shadow-[0_0_8px_rgba(192,132,252,0.15)]'
                  : 'bg-[#0e131b] text-[#64748b] hover:text-[#cbd5e1] border border-[#1f2937]'
              }`}
            >
              <span>🔑</span>
              <span>ASYMMETRIC (15)</span>
            </button>

            <button
              onClick={() => engine.setCategory('pqc')}
              className={`rounded-[2px] px-2 py-0.5 text-[9px] font-bold uppercase transition-all flex items-center gap-1 ${
                engine.category === 'pqc'
                  ? 'bg-[#0f1f2e] text-[#38bdf8] border border-[#38bdf8]/60 shadow-[0_0_8px_rgba(56,189,248,0.15)]'
                  : 'bg-[#0e131b] text-[#64748b] hover:text-[#cbd5e1] border border-[#1f2937]'
              }`}
            >
              <span>⚛</span>
              <span>POST-QUANTUM (5)</span>
            </button>
          </div>
        </div>

        {/* Right: Active Target & Cycle Counter */}
        <div className="flex items-center gap-2">
          {engine.algorithm && (
            <div className="flex items-center gap-1.5 rounded-[2px] bg-[#0e131b] px-2 py-0.5 border border-[#1f2937] text-[11px] tabular-nums">
              <span className="text-[#64748b] hidden sm:inline text-[9px] font-medium">TARGET:</span>
              <span className={`font-semibold ${engine.category === 'symmetric' ? 'text-[#34d399]' : 'text-[#38bdf8]'}`}>
                {engine.algorithm.info.name}
              </span>
              <span className="text-[9px] text-[#64748b]">
                [{engine.algorithm.info.category === 'symmetric' ? `${engine.algorithm.info.keySize || engine.algorithm.info.digestSize}b Key` : `${engine.algorithm.info.digestSize}b`}]
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 text-[11px] text-[#64748b] bg-[#0e131b] px-2 py-0.5 rounded-[2px] border border-[#1f2937] tabular-nums">
            <span className="text-[9px] font-medium">CYCLE:</span>
            <span className="font-semibold text-[#e5a93b] phosphor-amber">
              {engine.steps.length > 0 ? `${(playback.currentStep + 1).toString().padStart(2, '0')}/${engine.steps.length.toString().padStart(2, '0')}` : '00/00'}
            </span>
          </div>
        </div>
      </header>

      {/* ─── Two-Region App Layout: Sticky Sidebar + Fluid Width Main ───── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* ─── Left Sidebar: Collapsible with smooth transition ───────── */}
        <aside
          className={`shrink-0 bg-[#0a0d14] flex flex-col h-[calc(100vh-2.5rem)] sticky top-10 overflow-y-auto transition-all duration-300 ease-in-out z-20 ${
            sidebarOpen
              ? 'w-64 xl:w-72 p-3 border-r border-[#1f2937] opacity-100 pointer-events-auto'
              : 'w-0 p-0 border-r-0 opacity-0 pointer-events-none overflow-hidden'
          }`}
        >
          {sidebarOpen && (
            <div className="space-y-3.5 min-w-[220px]">
              <div className="flex items-center justify-between pb-1 border-b border-[#1f2937]">
                <span className="text-[9px] font-medium uppercase tracking-wider text-[#64748b]">
                  {engine.category === 'symmetric' ? 'CIPHER NAVIGATOR' : 'HASH NAVIGATOR'}
                </span>
                <button
                  onClick={toggleSidebar}
                  className="rounded-[2px] p-0.5 text-[#64748b] hover:bg-[#121620] hover:text-[#f8fafc] text-xs font-medium"
                  title="Collapse sidebar (Ctrl+B)"
                >
                  «
                </button>
              </div>

              <AlgorithmSelector
                algorithmsByFamily={engine.algorithmsByFamily}
                selectedAlgorithm={engine.algorithmName}
                onSelect={engine.setAlgorithmName}
              />

              {engine.algorithm && (
                <div className="pt-1.5 border-t border-[#1f2937]">
                  <AlgorithmInfoPanel info={engine.algorithm.info} />
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ─── Main Content: Fluid Width (Takes 100% remaining space) ─── */}
        <main className="flex-1 min-w-0 p-3 sm:p-3.5 overflow-y-auto space-y-2.5 transition-all duration-300">
          {/* Re-open Sidebar Floating Pill (when sidebar is hidden) */}
          {!sidebarOpen && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSidebar}
                className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#38bdf8]/40 bg-[#0f1d2e] px-2 py-0.5 text-[10px] font-medium text-[#38bdf8] hover:bg-[#152238] hover:text-white transition-all shadow-none"
              >
                <span>»</span>
                <span>EXPAND ALGORITHM REGISTRY</span>
              </button>
            </div>
          )}

          {/* Upper Deck: Data Stream Input + Live Output */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5 items-stretch">
            {(engine.category === 'symmetric' || engine.category === 'asymmetric') && engine.algorithm?.info ? (
              <>
                <CipherInputPanel
                  info={engine.algorithm.info}
                  input={engine.input}
                  onInputChange={engine.setInput}
                  keyHex={engine.keyHex}
                  onKeyHexChange={engine.setKeyHex}
                  ivHex={engine.ivHex}
                  onIvHexChange={engine.setIvHex}
                  aadHex={engine.aadHex}
                  onAadHexChange={engine.setAadHex}
                  tagHex={engine.tagHex}
                  onTagHexChange={engine.setTagHex}
                />
                <CipherOutput
                  outputHex={engine.digest}
                  tagHex={engine.resultTagHex}
                  tagValid={engine.tagValid}
                  algorithmName={engine.algorithmName}
                  direction={engine.algorithm.info.direction}
                  isComplete={isComplete}
                />
              </>
            ) : (
              <>
                <InputPanel
                  input={engine.input}
                  onInputChange={engine.setInput}
                  isXOF={engine.isXOF}
                  xofOutputBytes={engine.xofOutputBytes}
                  onXofOutputBytesChange={engine.setXofOutputBytes}
                />
                <HashOutput
                  digest={engine.digest}
                  algorithmName={engine.algorithmName}
                  digestSize={engine.isXOF ? engine.xofOutputBytes * 8 : (engine.algorithm?.info.digestSize ?? 0)}
                  isComplete={isComplete}
                />
              </>
            )}
          </div>

          {/* Clock & Transport Controls */}
          <PlaybackControls playback={playback} />

          {/* Phase Quick Jump Navigation */}
          {phases.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-[2px] bg-[#0c1017] border border-[#1f2937] text-xs">
              <span className="text-[9px] font-medium uppercase tracking-wider text-[#64748b] mr-1">
                JUMP TO PHASE:
              </span>
              {phases.map(({ phase, startIndex }) => (
                <button
                  key={`${phase}-${startIndex}`}
                  onClick={() => playback.setCurrentStep(startIndex)}
                  className={`rounded-[2px] px-2 py-0.5 text-[9px] font-mono uppercase transition-all tabular-nums ${
                    currentStepData?.phase === phase
                      ? 'bg-[#152238] text-[#38bdf8] border border-[#38bdf8]/60 font-semibold ring-1 ring-[#38bdf8]/30'
                      : 'bg-[#0e131b] text-[#94a3b8] hover:bg-[#141a24] hover:text-white border border-[#1f2937] font-medium'
                  }`}
                >
                  {phase}
                </button>
              ))}
            </div>
          )}

          {/* Step Visualizer (Signature 3-Column Logic Analyzer Architecture) */}
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
  const seenPhases = new Set<string>();

  steps.forEach((step, index) => {
    if (step.phase && !seenPhases.has(step.phase)) {
      seenPhases.add(step.phase);
      phases.push({ phase: step.phase, startIndex: index });
    }
  });
  return phases;
}
