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
      <div className="flex justify-center overflow-x-auto py-4">
        <TreeNodeComponent node={tree} />
      </div>
    );
  }

  if (nodes) {
    // Flat list display for simpler trees
    const levels = new Map<number, typeof nodes>();
    for (const node of nodes) {
      if (!levels.has(node.level)) levels.set(node.level, []);
      levels.get(node.level)!.push(node);
    }

    return (
      <div className="space-y-3">
        {Array.from(levels.entries())
          .sort(([a], [b]) => a - b)
          .map(([level, levelNodes]) => (
            <div key={level}>
              <h4 className="mb-1 text-xs text-gray-500">Level {level}</h4>
              <div className="flex flex-wrap gap-2">
                {levelNodes.map((node) => (
                  <div
                    key={node.label}
                    className={`rounded-md border px-2 py-1 font-mono text-xs ${
                      node.active
                        ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                        : 'border-gray-600 bg-gray-800 text-cyan-400'
                    }`}
                  >
                    <span className="text-gray-500">{node.label}: </span>
                    {node.value.slice(0, 16)}…
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    );
  }

  // Fallback
  return (
    <div className="text-sm text-gray-400">
      <pre className="overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function TreeNodeComponent({ node }: { node: TreeNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`rounded-md border px-3 py-1.5 font-mono text-xs ${
          node.active
            ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
            : 'border-gray-600 bg-gray-800 text-cyan-400'
        }`}
      >
        <div className="text-gray-500 text-[10px]">{node.label}</div>
        <div>{node.value.slice(0, 16)}…</div>
      </div>
      {node.children && node.children.length > 0 && (
        <>
          <div className="h-4 w-px bg-gray-600" />
          <div className="flex gap-6">
            {node.children.map((child, i) => (
              <TreeNodeComponent key={i} node={child} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
