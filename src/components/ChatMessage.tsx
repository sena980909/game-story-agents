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
  const isLong = content.length > 300;
  const displayContent = isLong && !expanded ? content.slice(0, 300) + "..." : content;

  return (
    <div className="animate-fade-in-up mb-4">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className="text-lg">{emoji}</span>
        <span className="font-bold text-sm text-purple-300">{agentName}</span>
        {targetAgentName && (
          <>
            <span className="text-xs text-gray-500">→</span>
            <span className="text-sm text-orange-300 font-semibold">
              @{targetAgentName}
            </span>
          </>
        )}
        <span className="text-xs text-gray-600">{phase}</span>
      </div>
      <div
        className={`ml-8 border rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap ${
          targetAgentName
            ? "bg-orange-900/10 border-orange-500/20"
            : "bg-[var(--card-bg)] border-[var(--card-border)]"
        }`}
      >
        {displayContent}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="block mt-2 text-purple-400 hover:text-purple-300 text-xs"
          >
            {expanded ? "접기 ▲" : "더 보기 ▼"}
          </button>
        )}
      </div>
    </div>
  );
}
