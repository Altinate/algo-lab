import type { ComputationStep } from '../algorithms/types';
import BinaryTransformView from './visualizations/BinaryTransformView';
import RoundComputationView from './visualizations/RoundComputationView';
import StateMatrixView from './visualizations/StateMatrixView';
import XorTableView from './visualizations/XorTableView';
import MerkleTreeView from './visualizations/MerkleTreeView';
import MixingFunctionView from './visualizations/MixingFunctionView';
import FinalDigestView from './visualizations/FinalDigestView';
import GenericStepView from './visualizations/GenericStepView';

interface StepVisualizerProps {
  step: ComputationStep | null;
  currentStep: number;
  totalSteps: number;
}

export default function StepVisualizer({
  step,
  currentStep,
  totalSteps,
}: StepVisualizerProps) {
  if (!step) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-700 bg-gray-800/30 p-8">
        <p className="text-gray-500">
          Type some text and use the playback controls to step through the
          algorithm.
        </p>
      </div>
    );
  }

  const renderVisualization = () => {
    switch (step.visualizationType) {
      case 'binary-transform':
        return <BinaryTransformView step={step} />;
      case 'round-computation':
        return <RoundComputationView step={step} />;
      case 'state-matrix':
        return <StateMatrixView step={step} />;
      case 'xor-table':
        return <XorTableView step={step} />;
      case 'merkle-tree':
        return <MerkleTreeView step={step} />;
      case 'mixing-function':
        return <MixingFunctionView step={step} />;
      case 'final-digest':
        return <FinalDigestView step={step} />;
      default:
        return <GenericStepView step={step} />;
    }
  };

  return (
    <div className="space-y-3">
      {/* Step header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-600/20 px-2 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/30">
              {step.phase}
            </span>
            <h3 className="text-lg font-semibold text-white">{step.title}</h3>
          </div>
        </div>
        <span className="shrink-0 text-xs text-gray-500">
          {currentStep + 1}/{totalSteps}
        </span>
      </div>

      {/* Step description */}
      <p className="whitespace-pre-line text-sm leading-relaxed text-gray-400">
        {step.description}
      </p>

      {/* Visualization content */}
      <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-4 overflow-x-auto">
        {renderVisualization()}
      </div>
    </div>
  );
}
