"use client";

import { useState } from "react";
import { StoryRequest } from "@/agents/types";

interface InputFormProps {
  onSubmit: (request: StoryRequest) => void;
  disabled: boolean;
}

const GENRE_PRESETS = [
  "판타지 RPG",
  "SF 액션",
  "포스트 아포칼립스",
  "사이버펑크",
  "동양 무협",
  "호러 서바이벌",
  "스팀펑크 어드벤처",
  "로그라이크 던전",
];

const GAMEPLAY_PRESETS = [
  "턴제 전투",
  "액션 전투",
  "탐험 중심",
  "퍼즐 중심",
  "대화/선택 중심",
  "잠입/스텔스",
  "덱빌딩",
  "생존/크래프팅",
];

const PLAYTIME_OPTIONS = ["3~5시간", "10~20시간", "30~50시간", "60시간 이상"];
const PLATFORM_OPTIONS = ["PC", "콘솔", "모바일", "크로스플랫폼"];
const TONE_OPTIONS = ["어둡고 무거움", "밝고 경쾌함", "서사적/웅장함", "감성적/서정적", "유머러스"];
const STRUCTURE_OPTIONS = ["선형 스토리", "분기형 멀티엔딩", "오픈월드 자유탐험", "챕터 기반"];

function ChipSelector({
  label,
  options,
  value,
  onChange,
  allowCustom,
  placeholder,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  allowCustom?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-bold mb-2 text-purple-300">
        {label}
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-1 rounded-full text-xs border transition-all ${
              value === opt
                ? "border-purple-500 bg-purple-500/20 text-purple-300"
                : "border-[var(--card-border)] hover:border-purple-500/50 text-gray-400"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {allowCustom && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "직접 입력 또는 위에서 선택"}
          className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-4 py-2 text-sm focus:outline-none input-glow"
        />
      )}
    </div>
  );
}

export default function InputForm({ onSubmit, disabled }: InputFormProps) {
  const [genre, setGenre] = useState("");
  const [theme, setTheme] = useState("");
  const [setting, setSetting] = useState("");
  const [gameplay, setGameplay] = useState("");
  const [playtime, setPlaytime] = useState("");
  const [platform, setPlatform] = useState("");
  const [tone, setTone] = useState("");
  const [structure, setStructure] = useState("");
  const [notes, setNotes] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!genre || !theme || !setting) return;

    const advancedNotes = [
      gameplay && `핵심 게임플레이: ${gameplay}`,
      playtime && `목표 플레이타임: ${playtime}`,
      platform && `플랫폼: ${platform}`,
      tone && `톤/분위기: ${tone}`,
      structure && `스토리 구조: ${structure}`,
      notes,
    ]
      .filter(Boolean)
      .join("\n");

    onSubmit({
      genre,
      theme,
      setting,
      additionalNotes: advancedNotes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ChipSelector
        label="🎮 장르"
        options={GENRE_PRESETS}
        value={genre}
        onChange={setGenre}
        allowCustom
      />

      <div>
        <label className="block text-sm font-bold mb-2 text-purple-300">
          💡 핵심 테마
        </label>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="예: 복수, 구원, 선택의 무게, 잃어버린 기억..."
          className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-4 py-2 text-sm focus:outline-none input-glow"
        />
      </div>

      <div>
        <label className="block text-sm font-bold mb-2 text-purple-300">
          🗺️ 배경 설정
        </label>
        <input
          type="text"
          value={setting}
          onChange={(e) => setSetting(e.target.value)}
          placeholder="예: 멸망 직전의 제국, 부유하는 섬들의 세계..."
          className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-4 py-2 text-sm focus:outline-none input-glow"
        />
      </div>

      {/* 고급 설정 토글 */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
      >
        {showAdvanced ? "▲ 고급 설정 접기" : "▼ 고급 설정 펼치기 (게임플레이, 플랫폼, 톤...)"}
      </button>

      {showAdvanced && (
        <div className="space-y-4 border border-[var(--card-border)] rounded-xl p-4 bg-[var(--card-bg)]/50">
          <ChipSelector
            label="🕹️ 핵심 게임플레이"
            options={GAMEPLAY_PRESETS}
            value={gameplay}
            onChange={setGameplay}
            allowCustom
            placeholder="어떤 게임플레이가 중심인가요?"
          />

          <ChipSelector
            label="⏱️ 목표 플레이타임"
            options={PLAYTIME_OPTIONS}
            value={playtime}
            onChange={setPlaytime}
          />

          <ChipSelector
            label="📱 타겟 플랫폼"
            options={PLATFORM_OPTIONS}
            value={platform}
            onChange={setPlatform}
          />

          <ChipSelector
            label="🎨 톤/분위기"
            options={TONE_OPTIONS}
            value={tone}
            onChange={setTone}
          />

          <ChipSelector
            label="📐 스토리 구조"
            options={STRUCTURE_OPTIONS}
            value={structure}
            onChange={setStructure}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-bold mb-2 text-gray-400">
          📝 추가 요청 (선택)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="특별히 원하는 요소가 있다면 적어주세요..."
          rows={3}
          className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={disabled || !genre || !theme || !setting}
        className="w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed btn-glow text-white"
      >
        {disabled ? (
          <span className="flex items-center justify-center gap-2">
            <span className="typing-indicator flex gap-1">
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full"></span>
            </span>
            에이전트 군단 작업 중...
          </span>
        ) : "🚀 에이전트 군단 출격!"}
      </button>
    </form>
  );
}
