"use client";

import { useEffect, useState } from "react";

interface AgentSeat {
  role: string;
  emoji: string;
  name: string;
  title: string;
  isActive: boolean;
  isDone: boolean;
  isTarget?: boolean;
  lastMessage?: string;
}

interface MeetingRoomProps {
  agents: AgentSeat[];
  currentPhase: string;
  isRunning: boolean;
  activeTargetAgent?: string;
}

// 테이블 주변 7자리 배치 (타원형)
const SEAT_POSITIONS = [
  { top: "2%", left: "50%", transform: "translateX(-50%)" },       // 0: director (상단 중앙)
  { top: "18%", left: "88%", transform: "translateX(-50%)" },      // 1: world_builder (우상)
  { top: "48%", left: "92%", transform: "translateX(-50%)" },      // 2: character_designer (우중)
  { top: "78%", left: "75%", transform: "translateX(-50%)" },      // 3: plot_architect (우하)
  { top: "78%", left: "25%", transform: "translateX(-50%)" },      // 4: quest_designer (좌하)
  { top: "48%", left: "8%", transform: "translateX(-50%)" },       // 5: dialogue_writer (좌중)
  { top: "18%", left: "12%", transform: "translateX(-50%)" },      // 6: systems_designer (좌상)
];

// 말풍선 방향
const BUBBLE_POSITIONS: Record<number, string> = {
  0: "bottom-left",
  1: "left",
  2: "left",
  3: "top-left",
  4: "top-right",
  5: "right",
  6: "right",
};

function SpeechBubble({
  content,
  direction,
  isActive,
}: {
  content: string;
  direction: string;
  isActive: boolean;
}) {
  const truncated = content.length > 80 ? content.slice(0, 80) + "..." : content;

  const positionClass = (() => {
    switch (direction) {
      case "bottom-left":
        return "top-full left-1/2 -translate-x-1/2 mt-2";
      case "top-left":
        return "bottom-full left-1/2 -translate-x-1/2 mb-2";
      case "left":
        return "top-1/2 right-full -translate-y-1/2 mr-2";
      case "right":
        return "top-1/2 left-full -translate-y-1/2 ml-2";
      default:
        return "top-full left-1/2 -translate-x-1/2 mt-2";
    }
  })();

  return (
    <div
      className={`absolute ${positionClass} z-20 w-52 animate-fade-in-up`}
    >
      <div
        className={`rounded-xl px-3 py-2 text-xs leading-relaxed shadow-lg border ${
          isActive
            ? "bg-purple-900/90 border-purple-500/60 text-purple-100"
            : "bg-[#1a1a2e]/90 border-[var(--card-border)] text-gray-300"
        }`}
      >
        {isActive ? (
          <div className="flex items-center gap-2">
            <span className="typing-indicator flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
            </span>
            <span className="text-purple-300">작업 중...</span>
          </div>
        ) : (
          truncated
        )}
      </div>
    </div>
  );
}

function AgentAvatar({ agent, index }: { agent: AgentSeat; index: number }) {
  const pos = SEAT_POSITIONS[index];
  const bubbleDir = BUBBLE_POSITIONS[index];
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleContent, setBubbleContent] = useState("");

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (agent.isActive) {
      setShowBubble(true);
      setBubbleContent("");
    } else if (agent.isDone && agent.lastMessage) {
      setShowBubble(true);
      setBubbleContent(agent.lastMessage);
      timer = setTimeout(() => setShowBubble(false), 8000);
    }
    return () => clearTimeout(timer);
  }, [agent.isActive, agent.isDone, agent.lastMessage]);

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ top: pos.top, left: pos.left, transform: pos.transform }}
    >
      {/* 아바타 */}
      <div className="relative">
        <div
          className={`
            w-16 h-16 rounded-full flex items-center justify-center text-2xl
            border-2 transition-all duration-500 cursor-pointer
            hover:scale-110
            ${
              agent.isActive
                ? "border-purple-400 bg-purple-500/20 animate-pulse-glow scale-110 shadow-[0_0_30px_rgba(124,58,237,0.4)]"
                : agent.isTarget
                  ? "border-orange-400 bg-orange-500/20 scale-105 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                  : agent.isDone
                    ? "border-green-400/70 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                    : "border-[var(--card-border)] bg-[var(--card-bg)] opacity-60"
            }
          `}
          onClick={() => {
            if (agent.isDone && agent.lastMessage) {
              setShowBubble((prev) => !prev);
            }
          }}
        >
          {agent.emoji}
          {agent.isDone && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md">
              ✓
            </div>
          )}
          {agent.isActive && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
            </div>
          )}
        </div>

        {/* 말풍선 */}
        {showBubble && (
          <SpeechBubble
            content={bubbleContent}
            direction={bubbleDir}
            isActive={agent.isActive}
          />
        )}
      </div>

      {/* 이름 */}
      <div className="mt-1.5 text-center">
        <div
          className={`text-xs font-bold ${
            agent.isActive
              ? "text-purple-300"
              : agent.isDone
                ? "text-green-300/80"
                : "text-gray-500"
          }`}
        >
          {agent.name}
        </div>
        <div className="text-[10px] text-gray-600 leading-tight">{agent.title}</div>
      </div>
    </div>
  );
}

export default function MeetingRoom({
  agents,
  currentPhase,
  isRunning,
  activeTargetAgent,
}: MeetingRoomProps) {
  return (
    <div className="relative w-full h-full min-h-[350px] max-h-full">
      {/* 회의실 배경 */}
      <div className="absolute inset-0 rounded-2xl border border-[var(--card-border)] bg-[#0d0d18] overflow-hidden">
        {/* 바닥 그리드 패턴 */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(124,58,237,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* 회의 테이블 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45%] h-[40%]">
          <div
            className={`w-full h-full rounded-[50%] border-2 transition-all duration-1000 ${
              isRunning
                ? "border-purple-500/40 bg-purple-900/10 shadow-[0_0_60px_rgba(124,58,237,0.15)]"
                : "border-[var(--card-border)] bg-[var(--card-bg)]/50"
            }`}
          >
            {/* 테이블 위 텍스트 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isRunning ? (
                <>
                  <div className="text-purple-400/60 text-xs font-bold uppercase tracking-widest">
                    회의 진행 중
                  </div>
                  <div className="text-purple-300/80 text-[11px] mt-1 max-w-[80%] text-center">
                    {currentPhase}
                  </div>
                </>
              ) : (
                <div className="text-gray-600 text-xs">기획 회의실</div>
              )}
            </div>
          </div>
        </div>

        {/* 에이전트 좌석 배치 */}
        <div className="absolute inset-6">
          {agents.map((agent, i) => (
            <AgentAvatar key={agent.role} agent={agent} index={i} />
          ))}
        </div>

        {/* 인터랙션 라인 */}
        {isRunning && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 5 }}
          >
            <defs>
              <marker id="arrowPurple" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="rgba(124,58,237,0.7)" />
              </marker>
              <marker id="arrowOrange" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="rgba(249,115,22,0.7)" />
              </marker>
            </defs>
            {(() => {
              const activeIdx = agents.findIndex((a) => a.isActive);
              const targetIdx = activeTargetAgent
                ? agents.findIndex((a) => a.role === activeTargetAgent)
                : -1;

              if (activeIdx < 0) return null;

              const activeSeat = SEAT_POSITIONS[activeIdx];
              const ax = parseFloat(activeSeat.left);
              const ay = parseFloat(activeSeat.top) + 5;

              if (targetIdx >= 0) {
                // 에이전트 → 에이전트 직접 피드백 라인
                const targetSeat = SEAT_POSITIONS[targetIdx];
                const tx = parseFloat(targetSeat.left);
                const ty = parseFloat(targetSeat.top) + 5;
                return (
                  <line
                    x1={`${ax}%`} y1={`${ay}%`}
                    x2={`${tx}%`} y2={`${ty}%`}
                    stroke="rgba(249,115,22,0.6)"
                    strokeWidth={2.5}
                    strokeDasharray="8 4"
                    markerEnd="url(#arrowOrange)"
                    className="animate-dash"
                  />
                );
              } else {
                // 에이전트 → 테이블 중심 (일반 발표)
                return (
                  <line
                    x1={`${ax}%`} y1={`${ay}%`}
                    x2="50%" y2="50%"
                    stroke="rgba(124,58,237,0.5)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    markerEnd="url(#arrowPurple)"
                    className="animate-dash"
                  />
                );
              }
            })()}
          </svg>
        )}
      </div>
    </div>
  );
}
