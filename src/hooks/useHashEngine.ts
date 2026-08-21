import { useState, useMemo, useCallback } from 'react';
import type { AlgorithmPlugin, ComputationStep } from '../algorithms/types';
import { getAlgorithm, listAlgorithms, getAlgorithmsByFamily } from '../algorithms/registry';

export interface HashEngineState {
  algorithmName: string;
  setAlgorithmName: (name: string) => void;
  input: string;
  setInput: (input: string) => void;
  xofOutputBytes: number;
  setXofOutputBytes: (bytes: number) => void;
  isXOF: boolean;
  algorithm: AlgorithmPlugin | undefined;
  algorithms: AlgorithmPlugin[];
  algorithmsByFamily: Map<string, AlgorithmPlugin[]>;
  steps: ComputationStep[];
  digest: string;
}

export function useHashEngine(): HashEngineState {
  const [algorithmName, setAlgorithmName] = useState('SHA-256');
  const [input, setInput] = useState('');
  const [xofOutputBytes, setXofOutputBytes] = useState<number>(32);

  const algorithm = useMemo(() => getAlgorithm(algorithmName), [algorithmName]);
  const algorithms = useMemo(() => listAlgorithms(), []);
  const algorithmsByFamily = useMemo(() => getAlgorithmsByFamily(), []);

  const isXOF = Boolean(algorithm?.info.isXOF || algorithmName.startsWith('SHAKE'));

  const result = useMemo(() => {
    if (!algorithm) return null;
    try {
      const options = isXOF ? { outputBytes: xofOutputBytes } : undefined;
      return algorithm.compute(input, options);
    } catch {
      return null;
    }
  }, [algorithm, input, isXOF, xofOutputBytes]);

  const handleSetAlgorithmName = useCallback((name: string) => {
    setAlgorithmName(name);
    if (name === 'SHAKE128') {
      setXofOutputBytes(32);
    } else if (name === 'SHAKE256') {
      setXofOutputBytes(64);
    }
  }, []);

  return {
    algorithmName,
    setAlgorithmName: handleSetAlgorithmName,
    input,
    setInput,
    xofOutputBytes,
    setXofOutputBytes,
    isXOF,
    algorithm,
    algorithms,
    algorithmsByFamily,
    steps: result?.steps ?? [],
    digest: result?.digest ?? '',
  };
}
