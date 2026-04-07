"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AGENT_CONFIGS } from "@/agents/configs";
import {
  CharacterRelationship,
  HistoryEntry,
  OrchestratorEvent,
  StoryRequest,
} from "@/agents/types";
import MeetingRoom from "@/components/MeetingRoom";
import ChatMessage from "@/components/ChatMessage";
import InputForm from "@/components/InputForm";
import RelationshipDiagram from "@/components/RelationshipDiagram";
import HistoryPanel from "@/components/HistoryPanel";

const HISTORY_KEY = "game-story-history";

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    // 최대 20개만 보관
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 20)));
  } catch {
    // localStorage 용량 초과 시 오래된 것 삭제
    try {
      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(entries.slice(0, 10))
      );
    } catch {
      // ignore
    }
  }
}

interface ChatEntry {
  emoji: string;
  agentName: string;
  phase: string;
  content: string;
  agentRole: string;
  targetAgentName?: string;
}

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [activeTargetAgent, setActiveTargetAgent] = useState<string | null>(
    null
  );
  const [doneAgents, setDoneAgents] = useState<Set<string>>(new Set());
  const [currentPhase, setCurrentPhase] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatEntry[]>([]);
  const [finalDoc, setFinalDoc] = useState<string | null>(null);
  const [relationships, setRelationships] = useState<CharacterRelationship[]>(
    []
  );
  const [showResult, setShowResult] = useState(false);
  const [viewMode, setViewMode] = useState<"room" | "chat">("room");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<StoryRequest | null>(null);
  const [resultTab, setResultTab] = useState<"doc" | "diagram">("doc");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 히스토리 로드
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const lastMessages: Record<string, string> = {};
  for (const msg of chatMessages) {
    lastMessages[msg.agentRole] = msg.content;
  }

  const meetingAgents = AGENT_CONFIGS.map((agent) => ({
    role: agent.role,
    emoji: agent.emoji,
    name: agent.name,
    title: agent.title,
    isActive: activeAgent === agent.role,
    isDone: doneAgents.has(agent.role),
    isTarget: activeTargetAgent === agent.role,
    lastMessage: lastMessages[agent.role],
  }));

  const handleSubmit = useCallback(async (request: StoryRequest) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsRunning(true);
    setActiveAgent(null);
    setDoneAgents(new Set());
    setChatMessages([]);
    setFinalDoc(null);
    setRelationships([]);
    setShowResult(false);
    setShowHistory(false);
    setViewMode("room");
    setError(null);
    setLastRequest(request);
    setResultTab("doc");

    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `서버 오류 (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("스트림을 열 수 없습니다.");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const event: OrchestratorEvent = JSON.parse(data);

            switch (event.type) {
              case "phase_change":
                setCurrentPhase(event.phase || "");
                break;
              case "agent_start":
                setActiveAgent(event.agent || null);
                setActiveTargetAgent(event.targetAgent || null);
                break;
              case "agent_message":
                setChatMessages((prev) => [
                  ...prev,
                  {
                    emoji: event.emoji || "",
                    agentName: event.agentName || "",
                    phase: event.phase || "",
                    content: event.content || "",
                    agentRole: event.agent || "",
                    targetAgentName: event.targetAgentName,
                  },
                ]);
                break;
              case "agent_done":
                setDoneAgents((prev) =>
                  new Set([...prev, event.agent || ""])
                );
                setActiveAgent(null);
                setActiveTargetAgent(null);
                break;
              case "complete": {
                const doc = event.finalDocument || null;
                const rels = event.relationships || [];
                setFinalDoc(doc);
                setRelationships(rels);
                setShowResult(true);

                // 히스토리에 저장
                if (doc && request) {
                  const entry: HistoryEntry = {
                    id: Date.now().toString(),
                    timestamp: Date.now(),
                    request,
                    finalDocument: doc,
                    relationships: rels,
                  };
                  setHistory((prev) => {
                    const updated = [entry, ...prev];
                    saveHistory(updated);
                    return updated;
                  });
                }
                break;
              }
              case "error":
                setError(event.content || "서버에서 오류가 발생했습니다.");
                break;
            }
          } catch {
            // skip invalid JSON
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const message =
        err instanceof Error
          ? err.message
          : "알 수 없는 오류가 발생했습니다.";
      setError(message);
    } finally {
      setIsRunning(false);
      setActiveAgent(null);
    }
  }, []);

  const handleDownload = (format: "txt" | "md") => {
    if (!finalDoc) return;
    const mimeType =
      format === "txt"
        ? "text/plain;charset=utf-8"
        : "text/markdown;charset=utf-8";
    const blob = new Blob([finalDoc], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `게임_스토리_기획서_${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!finalDoc) return;
    try {
      await navigator.clipboard.writeText(finalDoc);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = finalDoc;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setShowResult(false);
    setShowHistory(false);
    setChatMessages([]);
    setFinalDoc(null);
    setRelationships([]);
    setDoneAgents(new Set());
    setCurrentPhase("");
    setError(null);
    setIsRunning(false);
    setResultTab("doc");
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setFinalDoc(entry.finalDocument);
    setRelationships(entry.relationships || []);
    setLastRequest(entry.request);
    setShowResult(true);
    setShowHistory(false);
    setResultTab("doc");
  };

  const handleHistoryDelete = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      saveHistory(updated);
      return updated;
    });
  };

  const started = chatMessages.length > 0 || isRunning;

  // 라운드별 메시지 그룹핑
  const groupedMessages: { phase: string; messages: ChatEntry[] }[] = [];
  for (const msg of chatMessages) {
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.phase === msg.phase) {
      last.messages.push(msg);
    } else {
      groupedMessages.push({ phase: msg.phase, messages: [msg] });
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-mesh">
      {/* Header */}
      <header className="shrink-0 border-b border-[var(--card-border)] px-6 py-3 bg-[var(--background)]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-lg shadow-lg shadow-purple-500/20">
              🎮
            </div>
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                게임 스토리 에이전트 군단
              </h1>
              <p className="text-[10px] text-gray-500">
                AI 멀티에이전트 협업 기획 시스템
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentPhase && isRunning && (
              <div className="text-sm text-purple-400 animate-pulse">
                {currentPhase}
              </div>
            )}
            {/* 히스토리 버튼 */}
            {!isRunning && (
              <button
                onClick={() => {
                  setShowHistory((prev) => !prev);
                  if (!showHistory) setShowResult(false);
                }}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                  showHistory
                    ? "bg-purple-600 text-white border-purple-600"
                    : "border-[var(--card-border)] text-gray-400 hover:text-white hover:border-purple-500"
                }`}
              >
                📂 히스토리 {history.length > 0 && `(${history.length})`}
              </button>
            )}
            {started && !showResult && !showHistory && (
              <div className="flex bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("room")}
                  className={`px-3 py-1.5 text-xs transition-all ${
                    viewMode === "room"
                      ? "bg-purple-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  🏢 회의실
                </button>
                <button
                  onClick={() => setViewMode("chat")}
                  className={`px-3 py-1.5 text-xs transition-all ${
                    viewMode === "chat"
                      ? "bg-purple-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  💬 대화
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="shrink-0 bg-red-900/30 border-b border-red-500/30 px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-sm text-red-300">⚠️ {error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-200 text-xs"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 min-h-0 max-w-7xl mx-auto w-full">
        {showHistory ? (
          /* 히스토리 패널 */
          <HistoryPanel
            entries={history}
            onSelect={handleHistorySelect}
            onDelete={handleHistoryDelete}
            onClose={() => setShowHistory(false)}
          />
        ) : !started && !error ? (
          /* 초기: 입력 폼 */
          <div className="h-full overflow-y-auto flex items-center justify-center p-8">
            <div className="w-full max-w-lg animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  7명의 AI 에이전트가 대기 중
                </div>
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  어떤 게임을 만들고 싶으세요?
                </h2>
                <p className="text-gray-500 text-sm">
                  장르, 테마, 배경을 입력하면 에이전트들이 회의하며
                  <br />
                  완성된 게임 스토리 기획서를 만들어드립니다.
                </p>
              </div>
              <div className="glass-card rounded-2xl p-6">
                <InputForm onSubmit={handleSubmit} disabled={isRunning} />
              </div>
            </div>
          </div>
        ) : showResult && finalDoc ? (
          /* 최종 기획서 + 관계도 */
          <div className="h-full flex flex-col">
            <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold">📋 최종 게임 스토리 기획서</h2>
                {/* 기획서/관계도 탭 */}
                {relationships.length > 0 && (
                  <div className="flex bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg overflow-hidden">
                    <button
                      onClick={() => setResultTab("doc")}
                      className={`px-3 py-1 text-xs transition-all ${
                        resultTab === "doc"
                          ? "bg-purple-600 text-white"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      📄 기획서
                    </button>
                    <button
                      onClick={() => setResultTab("diagram")}
                      className={`px-3 py-1 text-xs transition-all ${
                        resultTab === "diagram"
                          ? "bg-purple-600 text-white"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      🔗 관계도
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowResult(false)}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  에이전트 대화 보기 →
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              {resultTab === "doc" ? (
                <>
                  <div className="glass-card rounded-2xl p-8 text-sm leading-relaxed whitespace-pre-wrap doc-content animate-fade-in">
                    {finalDoc}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 pb-4">
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2.5 text-xs rounded-xl glass-card hover:border-purple-500/50 transition-all font-medium"
                    >
                      📋 복사하기
                    </button>
                    <button
                      onClick={() => handleDownload("txt")}
                      className="px-4 py-2.5 text-xs rounded-xl glass-card hover:border-purple-500/50 transition-all font-medium"
                    >
                      📥 TXT 다운로드
                    </button>
                    <button
                      onClick={() => handleDownload("md")}
                      className="px-4 py-2.5 text-xs rounded-xl glass-card hover:border-purple-500/50 transition-all font-medium"
                    >
                      📝 MD 다운로드
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-4 py-2.5 text-xs rounded-xl btn-glow text-white font-medium"
                    >
                      🔄 새로 기획하기
                    </button>
                  </div>
                </>
              ) : (
                <div className="max-w-xl mx-auto animate-fade-in">
                  <RelationshipDiagram relationships={relationships} />
                  <div className="mt-4 text-center">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2.5 text-xs rounded-xl btn-glow text-white font-medium"
                    >
                      🔄 새로 기획하기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 진행 중: 회의실 + 대화 */
          <div className="h-full flex flex-col lg:flex-row">
            {/* 회의실 뷰 */}
            <div
              className={`${
                viewMode === "room" ? "flex" : "hidden lg:flex"
              } flex-1 min-h-0 flex-col p-4`}
            >
              {/* 진행률 바 */}
              {isRunning && (
                <div className="shrink-0 mb-3 glass-card rounded-xl px-4 py-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-purple-300 font-medium">진행률</span>
                    <span className="text-gray-400">
                      {chatMessages.length} / 27 발언
                    </span>
                  </div>
                  <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className="h-full progress-shimmer rounded-full transition-all duration-500"
                      style={{
                        width: `${(chatMessages.length / 27) * 100}%`,
                      }}
                    />
                  </div>
                  {currentPhase && (
                    <div className="mt-2 text-[10px] text-purple-400/80">{currentPhase}</div>
                  )}
                </div>
              )}
              <div className="flex-1 min-h-0">
                <MeetingRoom
                  agents={meetingAgents}
                  currentPhase={currentPhase}
                  isRunning={isRunning}
                  activeTargetAgent={activeTargetAgent || undefined}
                />
              </div>
            </div>

            {/* 대화 패널 */}
            <div
              className={`${
                viewMode === "chat" ? "flex" : "hidden lg:flex"
              } flex-col lg:w-[420px] lg:border-l border-[var(--card-border)] min-h-0`}
            >
              <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)]">
                <h2 className="text-sm font-bold">💬 에이전트 회의록</h2>
                {finalDoc && (
                  <button
                    onClick={() => setShowResult(true)}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    기획서 보기 →
                  </button>
                )}
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                {groupedMessages.map((group, gi) => (
                  <div key={gi} className="mb-4">
                    <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md py-2 mb-2">
                      <span className="phase-badge inline-block px-3 py-1 rounded-full text-[11px] font-bold text-purple-300">
                        {group.phase}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.messages.map((msg, mi) => (
                        <ChatMessage
                          key={`${gi}-${mi}`}
                          emoji={msg.emoji}
                          agentName={msg.agentName}
                          phase=""
                          content={msg.content}
                          targetAgentName={msg.targetAgentName}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {activeAgent && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 ml-8 mt-2">
                    <div className="typing-indicator flex gap-1">
                      <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                      <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                      <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                    </div>
                    <span>
                      {
                        AGENT_CONFIGS.find((a) => a.role === activeAgent)
                          ?.name
                      }
                      가 작업 중...
                    </span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
