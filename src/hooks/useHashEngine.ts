import { useState, useMemo, useCallback } from 'react';
import type { AlgorithmPlugin, ComputationStep } from '../algorithms/types';
import { getAlgorithm, listAlgorithms, getAlgorithmsByFamily } from '../algorithms/registry';

export interface HashEngineState {
  algorithmName: string;
  setAlgorithmName: (name: string) => void;
  input: string;
  setInput: (input: string) => void;
  algorithm: AlgorithmPlugin | undefined;
  algorithms: AlgorithmPlugin[];
  algorithmsByFamily: Map<string, AlgorithmPlugin[]>;
  steps: ComputationStep[];
  digest: string;
}

export function useHashEngine(): HashEngineState {
  const [algorithmName, setAlgorithmName] = useState('SHA-256');
  const [input, setInput] = useState('');

  const algorithm = useMemo(() => getAlgorithm(algorithmName), [algorithmName]);
  const algorithms = useMemo(() => listAlgorithms(), []);
  const algorithmsByFamily = useMemo(() => getAlgorithmsByFamily(), []);

  const result = useMemo(() => {
    if (!algorithm) return null;
    try {
      return algorithm.compute(input);
    } catch {
      return null;
    }
  }, [algorithm, input]);

  return {
    algorithmName,
    setAlgorithmName: useCallback((name: string) => {
      setAlgorithmName(name);
    }, []),
    input,
    setInput,
    algorithm,
    algorithms,
    algorithmsByFamily,
    steps: result?.steps ?? [],
    digest: result?.digest ?? '',
  };
}
