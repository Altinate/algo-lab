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

  const currentStepData =
    engine.steps.length > 0 ? engine.steps[playback.currentStep] ?? null : null;

  const isComplete =
    engine.steps.length > 0 &&
    playback.currentStep === engine.steps.length - 1;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">#️⃣</span>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Hash Algorithm Visualizer
              </h1>
              <p className="text-xs text-gray-500">
                Interactive step-by-step hash computation
              </p>
            </div>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Educational Tool
          </a>
        </div>
      </header>

      {/* Main layout */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-6">
            <AlgorithmSelector
              algorithmsByFamily={engine.algorithmsByFamily}
              selectedAlgorithm={engine.algorithmName}
              onSelect={engine.setAlgorithmName}
            />

            {engine.algorithm && (
              <AlgorithmInfoPanel info={engine.algorithm.info} />
            )}
          </aside>

          {/* Main content */}
          <main className="space-y-6">
            <InputPanel input={engine.input} onInputChange={engine.setInput} />

            <HashOutput
              digest={engine.digest}
              algorithmName={engine.algorithmName}
              digestSize={engine.algorithm?.info.digestSize ?? 0}
              isComplete={isComplete}
            />

            <PlaybackControls playback={playback} />

            <StepVisualizer
              step={currentStepData}
              currentStep={playback.currentStep}
              totalSteps={engine.steps.length}
            />

            {/* Phase navigation */}
            {engine.steps.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Jump to Phase
                </h3>
                <div className="flex flex-wrap gap-1">
                  {getPhases(engine.steps).map(({ phase, startIndex }) => (
                    <button
                      key={`${phase}-${startIndex}`}
                      onClick={() => playback.setCurrentStep(startIndex)}
                      className={`rounded-md px-2 py-1 text-xs transition-colors ${
                        currentStepData?.phase === phase
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      {phase}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
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
