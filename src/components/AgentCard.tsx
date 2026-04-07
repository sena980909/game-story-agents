"use client";

interface AgentCardProps {
  emoji: string;
  name: string;
  title: string;
  isActive: boolean;
  isDone: boolean;
}

export default function AgentCard({
  emoji,
  name,
  title,
  isActive,
  isDone,
}: AgentCardProps) {
  return (
    <div
      className={`
        relative flex items-center gap-3 rounded-xl px-4 py-3 border transition-all duration-300
        ${
          isActive
            ? "border-purple-500 bg-purple-500/10 animate-pulse-glow"
            : isDone
              ? "border-green-500/50 bg-green-500/5"
              : "border-[var(--card-border)] bg-[var(--card-bg)]"
        }
      `}
    >
      <div className="text-2xl">{emoji}</div>
      <div className="min-w-0">
        <div className="font-bold text-sm truncate">{name}</div>
        <div className="text-xs text-gray-500 truncate">{title}</div>
      </div>
      {isActive && (
        <div className="absolute top-1 right-2 flex gap-0.5 typing-indicator">
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
        </div>
      )}
      {isDone && (
        <div className="absolute top-1 right-2 text-green-400 text-xs">✓</div>
      )}
    </div>
  );
}
