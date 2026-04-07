"use client";

import { useState } from "react";

interface ChatMessageProps {
  emoji: string;
  agentName: string;
  phase: string;
  content: string;
  targetAgentName?: string;
}

export default function ChatMessage({
  emoji,
  agentName,
  phase,
  content,
  targetAgentName,
}: ChatMessageProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = content.length > 150;
  const displayContent =
    isLong && !expanded ? content.slice(0, 150) + "..." : content;

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-sm">{emoji}</span>
        <span className="font-bold text-xs text-purple-300">{agentName}</span>
        {targetAgentName && (
          <>
            <span className="text-[10px] text-gray-500">→</span>
            <span className="text-xs text-orange-300 font-semibold">
              @{targetAgentName}
            </span>
          </>
        )}
        {phase && (
          <span className="text-[10px] text-gray-600">{phase}</span>
        )}
      </div>
      <div
        className={`ml-6 rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap transition-all ${
          targetAgentName
            ? "bg-orange-900/10 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.05)]"
            : "glass-card"
        }`}
      >
        {displayContent}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-1 text-purple-400 hover:text-purple-300 text-[10px]"
          >
            {expanded ? "[접기]" : "[더보기]"}
          </button>
        )}
      </div>
    </div>
  );
}
