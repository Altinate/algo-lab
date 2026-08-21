import React from 'react';
import type { ComputationStep } from '../../algorithms/types';

interface Props {
  step: ComputationStep;
}

interface TreeNode {
  label: string;
  value: string;
  children?: TreeNode[];
  active?: boolean;
}

/** Visualizes BLAKE3's Merkle tree structure for multi-chunk inputs */
export default function MerkleTreeView({ step }: Props) {
  const data = step.data;
  const tree = data.tree as TreeNode | undefined;
  const nodes = data.nodes as Array<{ label: string; value: string; level: number; active?: boolean }> | undefined;

  if (tree) {
    return (
      <div className="flex justify-center overflow-x-auto py-2 font-mono">
        <TreeNodeComponent node={tree} />
      </div>
    );
  }

  if (nodes) {
    const levels = new Map<number, typeof nodes>();
    for (const node of nodes) {
      if (!levels.has(node.level)) levels.set(node.level, []);
      levels.get(node.level)!.push(node);
    }

    return (
      <div className="space-y-2 font-mono">
        {Array.from(levels.entries())
          .sort(([a], [b]) => a - b)
          .map(([level, levelNodes]) => (
            <div key={level} className="space-y-1">
              <h4 className="text-[9px] uppercase tracking-wider text-[#64748b] font-medium">TREE LEVEL {level}</h4>
              <div className="flex flex-wrap gap-1.5 tabular-nums">
                {levelNodes.map((node) => (
                  <div
                    key={node.label}
                    className={`rounded-[2px] border px-2 py-0.5 text-[11px] ${
                      node.active
                        ? 'border-[#e5a93b]/60 bg-[#15120c] text-[#e5a93b] font-semibold phosphor-amber'
                        : 'border-[#1f2937] bg-[#0e131b] text-[#38bdf8] font-medium'
                    }`}
                  >
                    <span className="text-[#64748b] text-[9px] mr-1">{node.label}:</span>
                    {node.value.slice(0, 16)}…
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    );
  }

  return (
    <div className="text-[11px] text-[#64748b] font-mono">
      TREE HIERARCHY DATA READY
    </div>
  );
}

function TreeNodeComponent({ node }: { node: TreeNode }) {
  return (
    <div className="flex flex-col items-center gap-1 font-mono">
      <div
        className={`rounded-[2px] border px-2 py-1 text-[11px] tabular-nums ${
          node.active
            ? 'border-[#e5a93b]/60 bg-[#15120c] text-[#e5a93b] font-semibold phosphor-amber'
            : 'border-[#1f2937] bg-[#0e131b] text-[#38bdf8] font-medium'
        }`}
      >
        <div className="text-[#64748b] text-[8px] uppercase tracking-wider">{node.label}</div>
        <div>{node.value.slice(0, 16)}…</div>
      </div>
      {node.children && node.children.length > 0 && (
        <>
          <div className="h-3 w-px bg-[#1f2937]" />
          <div className="flex gap-4">
            {node.children.map((child, i) => (
              <TreeNodeComponent key={i} node={child} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
