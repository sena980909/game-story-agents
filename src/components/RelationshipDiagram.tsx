"use client";

import { CharacterRelationship } from "@/agents/types";

interface Props {
  relationships: CharacterRelationship[];
}

const TYPE_COLORS: Record<string, { line: string; label: string }> = {
  ally: { line: "#22c55e", label: "동료" },
  enemy: { line: "#ef4444", label: "적대" },
  neutral: { line: "#6b7280", label: "중립" },
  romantic: { line: "#ec4899", label: "연인" },
  family: { line: "#f59e0b", label: "가족" },
};

export default function RelationshipDiagram({ relationships }: Props) {
  // 고유 캐릭터 추출
  const characters = Array.from(
    new Set(relationships.flatMap((r) => [r.from, r.to]))
  );

  if (characters.length === 0) return null;

  const cx = 250;
  const cy = 200;
  const radius = 140;

  // 원형 배치
  const positions = characters.map((_, i) => {
    const angle = (2 * Math.PI * i) / characters.length - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
      <h3 className="text-sm font-bold mb-3 text-purple-300">
        캐릭터 관계도
      </h3>

      {/* 범례 */}
      <div className="flex flex-wrap gap-3 mb-3">
        {Object.entries(TYPE_COLORS).map(([type, { line, label }]) => (
          <div key={type} className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <div className="w-4 h-0.5 rounded" style={{ backgroundColor: line }} />
            {label}
          </div>
        ))}
      </div>

      <svg viewBox="0 0 500 400" className="w-full max-w-[500px] mx-auto">
        <defs>
          {Object.entries(TYPE_COLORS).map(([type, { line }]) => (
            <marker
              key={type}
              id={`arrow-${type}`}
              markerWidth="6"
              markerHeight="4"
              refX="6"
              refY="2"
              orient="auto"
            >
              <polygon points="0 0, 6 2, 0 4" fill={line} />
            </marker>
          ))}
        </defs>

        {/* 관계선 */}
        {relationships.map((rel, i) => {
          const fromIdx = characters.indexOf(rel.from);
          const toIdx = characters.indexOf(rel.to);
          if (fromIdx < 0 || toIdx < 0) return null;

          const from = positions[fromIdx];
          const to = positions[toIdx];
          const color = TYPE_COLORS[rel.type] || TYPE_COLORS.neutral;

          // 곡선 중점
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const offset = 20;
          const ctrlX = midX - (dy / Math.sqrt(dx * dx + dy * dy)) * offset;
          const ctrlY = midY + (dx / Math.sqrt(dx * dx + dy * dy)) * offset;

          return (
            <g key={i}>
              <path
                d={`M ${from.x} ${from.y} Q ${ctrlX} ${ctrlY} ${to.x} ${to.y}`}
                fill="none"
                stroke={color.line}
                strokeWidth={1.5}
                opacity={0.7}
                markerEnd={`url(#arrow-${rel.type})`}
              />
              <text
                x={ctrlX}
                y={ctrlY - 6}
                textAnchor="middle"
                fill={color.line}
                fontSize="9"
                opacity={0.9}
              >
                {rel.relation}
              </text>
            </g>
          );
        })}

        {/* 캐릭터 노드 */}
        {characters.map((name, i) => (
          <g key={name}>
            <circle
              cx={positions[i].x}
              cy={positions[i].y}
              r={28}
              fill="#1a1a2e"
              stroke="#7c3aed"
              strokeWidth={2}
              opacity={0.9}
            />
            <text
              x={positions[i].x}
              y={positions[i].y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#e9d5ff"
              fontSize="11"
              fontWeight="bold"
            >
              {name.length > 6 ? name.slice(0, 5) + "…" : name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
