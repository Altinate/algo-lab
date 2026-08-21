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
      <div className="flex min-h-[260px] items-center justify-center rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-8 font-mono">
        <p className="text-[#64748b] text-xs">
          ENTER A DATA STREAM AND INITIALIZE CLOCK TO BEGIN COMPUTATION.
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
    <div className="space-y-2.5 font-mono">
      {/* Step header bar */}
      <div className="flex items-center justify-between border-b border-[#1f2937] pb-1.5">
        <div className="flex items-center gap-2">
          <span className="rounded-[2px] bg-[#0f1d2e] px-2 py-0.5 text-[10px] font-bold text-[#38bdf8] border border-[#38bdf8]/40 uppercase tracking-wider">
            PHASE: {step.phase}
          </span>
          <h3 className="text-sm font-bold text-[#f8fafc] tracking-tight">{step.title}</h3>
        </div>
        <span className="shrink-0 text-[10px] text-[#64748b] tabular-nums">
          OP: {currentStep + 1} OF {totalSteps}
        </span>
      </div>

      {/* Step description */}
      <p className="whitespace-pre-line text-xs leading-relaxed text-[#94a3b8] font-sans bg-[#0c1017] p-2.5 rounded-[2px] border border-[#1f2937]">
        {step.description}
      </p>

      {/* Visualization content */}
      <div className="rounded-[2px] border border-[#1f2937] bg-[#090c10] p-2 sm:p-3 overflow-x-auto">
        {renderVisualization()}
      </div>
    </div>
  );
}
