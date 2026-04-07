"use client";

import { HistoryEntry } from "@/agents/types";

interface Props {
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function HistoryPanel({ entries, onSelect, onDelete, onClose }: Props) {
  if (entries.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-[var(--card-border)]">
          <h2 className="text-lg font-bold">📂 기획 히스토리</h2>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-white">닫기</button>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          아직 저장된 기획이 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-[var(--card-border)]">
        <h2 className="text-lg font-bold">📂 기획 히스토리 ({entries.length})</h2>
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-white">닫기</button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 hover:border-purple-500/50 transition-all cursor-pointer"
            onClick={() => onSelect(entry)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-purple-300 truncate">
                  {entry.request.genre} / {entry.request.theme}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {entry.request.setting}
                </div>
                <div className="text-[10px] text-gray-600 mt-1">
                  {new Date(entry.timestamp).toLocaleString("ko-KR")}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry.id);
                }}
                className="text-xs text-gray-600 hover:text-red-400 ml-2 shrink-0"
              >
                삭제
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-2 line-clamp-2">
              {entry.finalDocument.slice(0, 120)}...
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
