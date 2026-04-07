import { runAgent } from "./agent";
import { getAgentConfig } from "./configs";
import {
  AgentMessage,
  AgentRole,
  OrchestratorEvent,
  StoryRequest,
} from "./types";

// ── 회의 구조 정의 ──

interface Discussion {
  speaker: AgentRole;
  target?: AgentRole;
  directive: string;
}

interface MeetingRound {
  name: string;
  description: string;
  discussions: Discussion[];
}

function buildMeetingRounds(request: StoryRequest): MeetingRound[] {
  const brief = `장르: ${request.genre}, 테마: ${request.theme}, 배경: ${request.setting}${request.additionalNotes ? `, 추가사항: ${request.additionalNotes}` : ""}`;

  return [
    // ── 라운드 1: 초안 발표 ──
    {
      name: "📋 라운드 1: 초안 발표",
      description: "각 에이전트가 자기 분야의 초안을 발표합니다",
      discussions: [
        {
          speaker: "director",
          directive: `[회의 시작] 유저가 요청한 게임 컨셉(${brief})을 분석하고, 전체 기획 방향을 설정해주세요. 장르적 특성, 핵심 재미 요소, 타겟 감성을 정의하세요. 이건 첫 회의이므로 다른 에이전트들이 작업할 수 있도록 명확한 방향을 제시하세요.`,
        },
        {
          speaker: "world_builder",
          directive:
            "디렉터의 기획 방향을 바탕으로 세계관 초안을 발표하세요. 배경 설정, 핵심 세력, 마법/기술 체계, 주요 장소를 설계하세요. 이것은 초안이므로 다른 에이전트들의 피드백을 반영하여 수정될 수 있습니다.",
        },
        {
          speaker: "character_designer",
          directive:
            "세계관 초안을 참고하여 핵심 캐릭터 초안을 발표하세요. 주인공, 동료 2명, 적대자 1명, 핵심 NPC 1명을 설계하세요. 다른 에이전트들의 피드백을 받을 예정이니 수정 가능한 부분을 열어두세요.",
        },
        {
          speaker: "plot_architect",
          directive:
            "세계관과 캐릭터 초안을 바탕으로 메인 스토리라인 초안을 발표하세요. 기승전결 큰 흐름과 핵심 분기점 2~3개를 제시하세요.",
        },
        {
          speaker: "systems_designer",
          directive:
            "지금까지의 세계관/캐릭터/플롯 초안을 바탕으로 핵심 게임 시스템 초안을 발표하세요. 핵심 루프, 성장 시스템, 전투 메카닉을 간략히 제시하세요.",
        },
      ],
    },

    // ── 라운드 2: 상호 피드백 ──
    {
      name: "💬 라운드 2: 상호 피드백",
      description: "에이전트들이 서로의 초안에 피드백을 주고받습니다",
      discussions: [
        {
          speaker: "character_designer",
          target: "world_builder",
          directive:
            "월드빌더의 세계관 초안을 검토하세요. 내 캐릭터들이 이 세계관에서 자연스럽게 존재할 수 있는지 확인하고, 세계관에 추가/수정이 필요한 부분을 구체적으로 지적하세요. 예: '이 세력 구도에서 적대자의 동기가 약하다', '이 기술 체계에 캐릭터 능력이 맞지 않는다' 등.",
        },
        {
          speaker: "plot_architect",
          target: "character_designer",
          directive:
            "캐릭터 디자이너의 캐릭터 초안을 검토하세요. 내 스토리라인에서 이 캐릭터들이 잘 작동하는지, 동기가 플롯과 맞는지, 캐릭터 관계가 스토리 긴장감을 만드는지 피드백하세요. 수정이 필요한 캐릭터가 있다면 구체적으로 제안하세요.",
        },
        {
          speaker: "systems_designer",
          target: "plot_architect",
          directive:
            "플롯 아키텍트의 스토리 초안을 게임 시스템 관점에서 검토하세요. 스토리 페이싱이 게임플레이 루프와 맞는지, 분기점이 시스템적으로 구현 가능한지, 목표 플레이타임에 스토리 볼륨이 적절한지 피드백하세요.",
        },
        {
          speaker: "world_builder",
          target: "systems_designer",
          directive:
            "시스템 디자이너의 게임 시스템 초안을 검토하세요. 내 세계관의 법칙/설정과 게임 메카닉이 일관되는지 확인하세요. 예: 마법 체계와 스킬 시스템의 정합성, 경제 시스템과 세계관 내 자원의 일관성 등을 피드백하세요.",
        },
        {
          speaker: "director",
          directive:
            "지금까지 나온 모든 초안과 상호 피드백을 종합적으로 검토하세요. 각 에이전트 간 충돌이나 모순을 정리하고, 어떤 피드백을 반영해야 하는지 우선순위를 매기세요. 구체적인 수정 지시를 내려주세요.",
        },
      ],
    },

    // ── 라운드 3: 수정 및 보강 ──
    {
      name: "🔧 라운드 3: 수정 및 보강",
      description: "피드백을 반영하여 각자의 파트를 수정합니다",
      discussions: [
        {
          speaker: "world_builder",
          directive:
            "라운드 2에서 받은 피드백과 디렉터의 수정 지시를 반영하여 세계관을 수정/보강하세요. 변경된 부분을 명확히 표시하고, 왜 변경했는지 간단히 설명하세요.",
        },
        {
          speaker: "character_designer",
          directive:
            "라운드 2에서 받은 피드백과 디렉터의 수정 지시를 반영하여 캐릭터를 수정/보강하세요. 특히 플롯과의 정합성, 세계관과의 일관성에 집중하세요. 변경 사항을 명시하세요.",
        },
        {
          speaker: "plot_architect",
          directive:
            "라운드 2 피드백을 반영하여 플롯을 수정하세요. 시스템 디자이너의 페이싱 피드백, 수정된 캐릭터/세계관을 반영하세요. 메인 퀘스트 흐름, 분기점, 엔딩 분기를 확정하세요.",
        },
        {
          speaker: "quest_designer",
          directive:
            "수정된 플롯/세계관/캐릭터/시스템을 바탕으로 구체적인 퀘스트를 설계하세요. 메인 퀘스트 5개 이상, 서브 퀘스트 3개 이상. 각 퀘스트의 목표, 과정, 보상, 연결 관계를 정의하세요. 시스템 디자이너의 성장/경제 시스템과 보상이 연동되도록 하세요.",
        },
        {
          speaker: "systems_designer",
          directive:
            "수정된 세계관/캐릭터/플롯/퀘스트를 반영하여 게임 시스템을 확정하세요. 핵심 루프, 성장 곡선, 난이도 곡선, 경제 밸런스를 구체적 수치와 함께 제시하세요. 퀘스트 보상과 성장 시스템의 연동을 확인하세요.",
        },
        {
          speaker: "dialogue_writer",
          directive:
            "확정된 캐릭터/플롯/퀘스트를 바탕으로 핵심 장면 4개의 대사를 작성하세요: 1) 오프닝, 2) 핵심 반전, 3) 클라이맥스, 4) 엔딩 중 하나. 캐릭터별 말투를 차별화하고, 선택지 대사도 포함하세요.",
        },
      ],
    },

    // ── 라운드 4: 최종 통합 ──
    {
      name: "📑 라운드 4: 최종 통합",
      description: "디렉터가 모든 결과를 검증하고 최종 기획서를 작성합니다",
      discussions: [
        {
          speaker: "director",
          directive:
            "모든 라운드의 결과를 종합하여 최종 게임 기획서를 작성하세요. 반드시 포함: 1) 기획 개요 (장르/핵심매력/타겟/플레이타임), 2) 세계관 요약, 3) 핵심 캐릭터 프로필, 4) 메인 스토리 흐름 및 분기, 5) 핵심 퀘스트 목록, 6) 게임 시스템 요약, 7) 핵심 대사 하이라이트, 8) 라운드 2에서 발견된 충돌의 해결 결과, 9) 남은 과제/리스크. 이것은 개발팀에 전달할 최종 문서입니다.",
        },
      ],
    },
  ];
}

// ── 회의 실행 ──

export async function* orchestrate(
  request: StoryRequest
): AsyncGenerator<OrchestratorEvent> {
  const rounds = buildMeetingRounds(request);
  const allMessages: AgentMessage[] = [];

  const userRequest = `게임 스토리를 기획해주세요.\n- 장르: ${request.genre}\n- 테마: ${request.theme}\n- 배경: ${request.setting}${request.additionalNotes ? `\n- 추가 요청: ${request.additionalNotes}` : ""}`;

  for (const round of rounds) {
    yield {
      type: "phase_change",
      phase: round.name,
    };

    for (const discussion of round.discussions) {
      const config = getAgentConfig(discussion.speaker);
      const targetConfig = discussion.target
        ? getAgentConfig(discussion.target)
        : undefined;

      yield {
        type: "agent_start",
        agent: discussion.speaker,
        agentName: config.name,
        emoji: config.emoji,
        phase: round.name,
        targetAgent: discussion.target,
        targetAgentName: targetConfig?.name,
      };

      // 시스템 프롬프트에 회의 맥락 추가
      const meetingContext = discussion.target
        ? `\n\n당신은 지금 회의 중이며, ${targetConfig!.name}(${targetConfig!.title})에게 직접 피드백을 주고 있습니다. 상대방의 작업물을 구체적으로 참조하며 건설적인 피드백을 주세요. 동의하는 부분과 수정이 필요한 부분을 모두 언급하세요.`
        : `\n\n당신은 지금 팀 회의에 참석 중입니다. 이전 발언들을 참고하여 답변하세요.`;

      const enhancedConfig = {
        ...config,
        systemPrompt: config.systemPrompt + meetingContext,
      };

      const result = await runAgent(
        enhancedConfig,
        userRequest,
        allMessages,
        discussion.directive
      );

      const message: AgentMessage = {
        role: discussion.speaker,
        agentName: config.name,
        content: result,
        timestamp: Date.now(),
        phase: round.name,
        targetAgent: discussion.target,
      };
      allMessages.push(message);

      yield {
        type: "agent_message",
        agent: discussion.speaker,
        targetAgent: discussion.target,
        agentName: config.name,
        targetAgentName: targetConfig?.name,
        emoji: config.emoji,
        phase: round.name,
        content: result,
      };

      yield {
        type: "agent_done",
        agent: discussion.speaker,
        agentName: config.name,
        phase: round.name,
      };
    }
  }

  // 최종 문서 구성: 라운드4 개요 + 라운드3 상세 전문
  const r4 = allMessages.filter((m) => m.phase === "📑 라운드 4: 최종 통합");
  const r3 = allMessages.filter((m) => m.phase === "🔧 라운드 3: 수정 및 보강");

  const sectionOrder: { role: string; title: string }[] = [
    { role: "world_builder", title: "세계관 상세" },
    { role: "character_designer", title: "캐릭터 상세" },
    { role: "plot_architect", title: "스토리 구조 상세" },
    { role: "quest_designer", title: "퀘스트 설계 상세" },
    { role: "systems_designer", title: "게임 시스템 상세" },
    { role: "dialogue_writer", title: "핵심 대사 및 연출" },
  ];

  const overviewSection = r4.length > 0
    ? `# 📋 게임 스토리 기획서\n\n${r4.map((m) => m.content).join("\n\n")}`
    : "";

  const detailSections = sectionOrder
    .map(({ role, title }) => {
      const msg = r3.find((m) => m.role === role);
      if (!msg) return null;
      const cfg = getAgentConfig(role);
      return `---\n\n# ${cfg.emoji} ${title}\n**담당: ${cfg.name} (${cfg.title})**\n\n${msg.content}`;
    })
    .filter(Boolean)
    .join("\n\n");

  const finalDoc = [overviewSection, detailSections].filter(Boolean).join("\n\n");

  yield {
    type: "complete",
    finalDocument: finalDoc,
  };
}
