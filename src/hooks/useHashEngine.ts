import { useState, useMemo, useCallback } from 'react';
import type { AlgorithmPlugin, ComputationStep, AlgorithmCategory } from '../algorithms/types';
import { getAlgorithm, listAlgorithms, getAlgorithmsByFamily } from '../algorithms/registry';

export interface HashEngineState {
  category: AlgorithmCategory;
  setCategory: (cat: AlgorithmCategory) => void;
  algorithmName: string;
  setAlgorithmName: (name: string) => void;
  input: string;
  setInput: (input: string) => void;
  xofOutputBytes: number;
  setXofOutputBytes: (bytes: number) => void;
  isXOF: boolean;
  // Symmetric Parameters
  keyHex: string;
  setKeyHex: (key: string) => void;
  ivHex: string;
  setIvHex: (iv: string) => void;
  aadHex: string;
  setAadHex: (aad: string) => void;
  tagHex: string;
  setTagHex: (tag: string) => void;
  resultTagHex?: string;
  tagValid?: boolean;
  algorithm: AlgorithmPlugin | undefined;
  algorithms: AlgorithmPlugin[];
  algorithmsByFamily: Map<string, AlgorithmPlugin[]>;
  steps: ComputationStep[];
  digest: string;
}

export function useHashEngine(): HashEngineState {
  const [category, setCategoryState] = useState<AlgorithmCategory>('hash');
  const [algorithmName, setAlgorithmName] = useState('SHA-256');
  const [input, setInput] = useState('');
  const [xofOutputBytes, setXofOutputBytes] = useState<number>(32);

  // Symmetric Cipher States
  const [keyHex, setKeyHex] = useState('2b7e151628aed2a6abf7158809cf4f3c');
  const [ivHex, setIvHex] = useState('000102030405060708090a0b0c0d0e0f');
  const [aadHex, setAadHex] = useState('feedfacedeadbeefcafebeeffeedfacedeadbeefcafebeef');
  const [tagHex, setTagHex] = useState('');

  const algorithm = useMemo(() => getAlgorithm(algorithmName), [algorithmName]);
  const algorithms = useMemo(() => listAlgorithms(category), [category]);
  const algorithmsByFamily = useMemo(() => getAlgorithmsByFamily(category), [category]);

  const isXOF = Boolean(algorithm?.info.isXOF || algorithmName.startsWith('SHAKE'));

  const result = useMemo(() => {
    if (!algorithm) return null;
    try {
      const options = {
        outputBytes: isXOF ? xofOutputBytes : undefined,
        keyHex,
        ivHex,
        aadHex,
        tagHex,
      };
      return algorithm.compute(input, options);
    } catch {
      return null;
    }
  }, [algorithm, input, isXOF, xofOutputBytes, keyHex, ivHex, aadHex, tagHex]);

  const handleSetCategory = useCallback((cat: AlgorithmCategory) => {
    setCategoryState(cat);
    if (cat === 'hash') {
      setAlgorithmName('SHA-256');
      setInput('');
    } else if (cat === 'symmetric') {
      setAlgorithmName('AES-128-CBC (Encrypt)');
      setInput('Hello, CryptoScope AES-128-CBC!');
      setKeyHex('2b7e151628aed2a6abf7158809cf4f3c');
      setIvHex('000102030405060708090a0b0c0d0e0f');
    } else if (cat === 'asymmetric') {
      setAlgorithmName('RSA-2048 (Encrypt)');
      setInput('Hello, RSA-2048!');
    } else if (cat === 'pqc') {
      setAlgorithmName('ML-KEM-768 (Encapsulate)');
      setInput('');
    } else if (cat === 'encoding') {
      setAlgorithmName('Base64 (Encode)');
      setInput('Hello, World!');
    }
  }, []);

  const handleSetAlgorithmName = useCallback((name: string) => {
    setAlgorithmName(name);
    if (name === 'SHAKE128') {
      setXofOutputBytes(32);
    } else if (name === 'SHAKE256') {
      setXofOutputBytes(64);
    } else if (name.startsWith('AES-192')) {
      setKeyHex('8e73b0f7da0e6452c810f32b809079e562f8ead2522c6b7b');
    } else if (name.startsWith('AES-256')) {
      setKeyHex('603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4');
    } else if (name.startsWith('AES-128')) {
      setKeyHex('2b7e151628aed2a6abf7158809cf4f3c');
    }
  }, []);

  return {
    category,
    setCategory: handleSetCategory,
    algorithmName,
    setAlgorithmName: handleSetAlgorithmName,
    input,
    setInput,
    xofOutputBytes,
    setXofOutputBytes,
    isXOF,
    keyHex,
    setKeyHex,
    ivHex,
    setIvHex,
    aadHex,
    setAadHex,
    tagHex,
    setTagHex,
    resultTagHex: result?.tagHex,
    tagValid: result?.tagValid,
    algorithm,
    algorithms,
    algorithmsByFamily,
    steps: result?.steps ?? [],
    digest: result?.digest ?? '',
  };
}

