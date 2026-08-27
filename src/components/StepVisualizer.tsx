import type { ComputationStep } from '../algorithms/types';
import BinaryTransformView from './visualizations/BinaryTransformView';
import RoundComputationView from './visualizations/RoundComputationView';
import StateMatrixView from './visualizations/StateMatrixView';
import XorTableView from './visualizations/XorTableView';
import MerkleTreeView from './visualizations/MerkleTreeView';
import MixingFunctionView from './visualizations/MixingFunctionView';
import FinalDigestView from './visualizations/FinalDigestView';
import GenericStepView from './visualizations/GenericStepView';
import AesStateMatrixView from './visualizations/AesStateMatrixView';
import FeistelLadderView from './visualizations/FeistelLadderView';
import AsymmetricModExpView from './visualizations/AsymmetricModExpView';
import EccPointView from './visualizations/EccPointView';
import KeyExchangeView from './visualizations/KeyExchangeView';
import LatticePolynomialView from './visualizations/LatticePolynomialView';
import FormatInspectorView from './visualizations/FormatInspectorView';
import EntropyAnalysisView from './visualizations/EntropyAnalysisView';

interface StepVisualizerProps {
  step: ComputationStep | null;
  currentStep: number;
  totalSteps: number;
  input?: string;
  onNavigateToAlgorithm?: (algoName: string, initialInput?: string) => void;
}

export default function StepVisualizer({
  step,
  currentStep,
  totalSteps,
  input,
  onNavigateToAlgorithm,
}: StepVisualizerProps) {
  if (!step) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-[2px] border border-[#1f2937] bg-[#0c1017] p-6 font-mono">
        <p className="text-[#64748b] text-[11px] uppercase tracking-wider">
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
      case 'aes-state-matrix':
        return <AesStateMatrixView step={step} />;
      case 'feistel-ladder':
        return <FeistelLadderView step={step} />;
      case 'asymmetric-modexp':
        return <AsymmetricModExpView step={step} />;
      case 'ecc-point':
        return <EccPointView step={step} />;
      case 'key-exchange':
        return <KeyExchangeView step={step} />;
      case 'lattice-polynomial':
        return <LatticePolynomialView step={step} />;
      case 'xor-table':
        return <XorTableView step={step} />;
      case 'merkle-tree':
        return <MerkleTreeView step={step} />;
      case 'mixing-function':
        return <MixingFunctionView step={step} />;
      case 'asn1-structure':
        return <FormatInspectorView step={step} />;
      case 'entropy-analysis':
        return <EntropyAnalysisView step={step} input={input} onNavigateToAlgorithm={onNavigateToAlgorithm} />;
      case 'final-digest':
        return <FinalDigestView step={step} />;
      default:
        return <GenericStepView step={step} />;
    }
  };

  return (
    <div className="space-y-2 font-mono">
      {/* Step header bar */}
      <div className="flex items-center justify-between border-b border-[#1f2937] pb-1.5">
        <div className="flex items-center gap-2">
          <span className="rounded-[2px] bg-[#0f1d2e] px-1.5 py-0.5 text-[9px] font-semibold text-[#38bdf8] border border-[#38bdf8]/40 uppercase tracking-wider">
            {step.phase}
          </span>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f8fafc]">
            {step.title}
          </h3>
        </div>
        <span className="shrink-0 text-[10px] text-[#64748b] tabular-nums font-mono">
          OP: {(currentStep + 1).toString().padStart(2, '0')}/{(totalSteps).toString().padStart(2, '0')}
        </span>
      </div>

      {/* Step description */}
      <p className="whitespace-pre-line text-[11px] leading-relaxed text-[#94a3b8] font-mono bg-[#0c1017] p-2.5 rounded-[2px] border border-[#1f2937]">
        {step.description}
      </p>

      {/* Visualization content */}
      <div className="rounded-[2px] border border-[#1f2937] bg-[#090c10] p-2 sm:p-2.5 overflow-x-auto">
        {renderVisualization()}
      </div>
    </div>
  );
}
