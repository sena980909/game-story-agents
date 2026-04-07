import { runAgent } from "./agent";
import { getAgentConfig } from "./configs";
import {
  AgentMessage,
  AgentRole,
  CharacterRelationship,
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
  model: string;
}

function buildMeetingRounds(request: StoryRequest): MeetingRound[] {
  const brief = `장르: ${request.genre}, 테마: ${request.theme}, 배경: ${request.setting}${request.additionalNotes ? `, 추가사항: ${request.additionalNotes}` : ""}`;

  return [
    // ── 라운드 1: 초안 발표 ──
    {
      name: "📋 라운드 1: 초안 발표",
      description: "각 에이전트가 자기 분야의 초안을 발표합니다",
      model: "claude-haiku-4-5-20251001",
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

    // ── 라운드 2: 상호 비판 & 디베이트 ──
    {
      name: "⚡ 라운드 2: 비판 & 반론",
      description: "에이전트들이 서로의 초안을 비판하고 반론합니다",
      model: "claude-haiku-4-5-20251001",
      discussions: [
        // ── 2-A: 공격적 비판 (문제 제기) ──
        {
          speaker: "character_designer",
          target: "world_builder",
          directive:
            "월드빌더의 세계관 초안에서 문제점을 찾아 날카롭게 비판하세요. 단순히 '좋다/나쁘다'가 아니라 구체적 근거와 함께 지적하세요. 예: '이 세력 구도는 적대자 동기를 설명 못 한다 — 왜냐하면...', '이 마법 체계는 내 캐릭터 능력과 충돌한다 — 구체적으로...' 동의하는 부분도 있다면 왜 좋은지 근거를 대세요.",
        },
        {
          speaker: "plot_architect",
          target: "character_designer",
          directive:
            "캐릭터 디자이너의 캐릭터 초안에서 스토리적 약점을 비판하세요. '이 캐릭터는 내 플롯에서 작동하지 않는다'면 왜 안 되는지 구체적으로 논증하세요. 동기, 관계, 성장 아크의 문제점을 짚고, 대안을 제시하세요.",
        },
        {
          speaker: "systems_designer",
          target: "plot_architect",
          directive:
            "플롯 아키텍트의 스토리를 게임 시스템 관점에서 비판하세요. 페이싱, 분기 구현 가능성, 플레이타임 대비 볼륨을 분석하세요. '이 분기점은 시스템적으로 비용 대비 효과가 낮다', '이 페이싱은 플레이어 이탈을 유발한다' 등 구체적 문제를 제기하세요.",
        },
        {
          speaker: "world_builder",
          target: "systems_designer",
          directive:
            "시스템 디자이너의 게임 시스템이 내 세계관과 충돌하는 부분을 비판하세요. '이 스킬 시스템은 세계관의 마법 법칙에 위배된다', '이 경제 구조는 세계관 설정과 모순된다' 등 정합성 문제를 구체적으로 지적하세요.",
        },
        // ── 2-B: 반론 & 방어 (디베이트) ──
        {
          speaker: "world_builder",
          target: "character_designer",
          directive:
            "캐릭터 디자이너가 당신의 세계관에 제기한 비판을 읽고 반론하세요. 타당한 비판은 솔직히 인정하고 수정 방향을 제시하세요. 하지만 동의하지 않는 비판에는 근거를 들어 반박하세요. 절충안이 있다면 구체적으로 제안하세요. 단순히 '반영하겠습니다'가 아니라 왜 당신의 원래 설계가 의미 있는지 주장하세요.",
        },
        {
          speaker: "character_designer",
          target: "plot_architect",
          directive:
            "플롯 아키텍트가 당신의 캐릭터에 제기한 비판을 읽고 반론하세요. 인정할 부분은 인정하되, 캐릭터 설계 의도가 왜 유효한지 방어하세요. 플롯 쪽에서 조정해야 할 부분이 있다면 역으로 제안하세요.",
        },
        {
          speaker: "plot_architect",
          target: "systems_designer",
          directive:
            "시스템 디자이너가 당신의 스토리에 제기한 비판을 읽고 반론하세요. 시스템 제약을 인정하면서도, 스토리적으로 포기할 수 없는 부분은 왜 중요한지 논증하세요. 시스템과 스토리 모두 살리는 절충안을 제시하세요.",
        },
        {
          speaker: "systems_designer",
          target: "world_builder",
          directive:
            "월드빌더가 당신의 시스템에 제기한 비판을 읽고 반론하세요. 세계관 정합성을 인정하면서도, 게임 재미와 밸런스를 위해 양보할 수 없는 부분을 논증하세요. 세계관 설정을 존중하면서 시스템을 조정하는 방법을 제안하세요.",
        },
        // ── 2-C: 디렉터 판정 ──
        {
          speaker: "director",
          directive:
            "모든 비판과 반론을 검토하고 최종 판정을 내리세요. 각 쟁점별로: 1) 쟁점 요약, 2) 양측 주장의 타당성 평가, 3) 최종 결정과 그 근거를 명시하세요. 모호한 타협이 아니라 명확한 방향을 제시하세요. 반영해야 할 수정사항을 에이전트별로 정리하세요.",
        },
      ],
    },

    // ── 라운드 3: 수정 및 보강 ──
    {
      name: "🔧 라운드 3: 수정 및 보강",
      description: "피드백을 반영하여 각자의 파트를 수정합니다",
      model: "claude-haiku-4-5-20251001",
      discussions: [
        {
          speaker: "world_builder",
          directive:
            "라운드 2에서 받은 피드백과 디렉터의 수정 지시를 반영하여 세계관을 수정/보강하세요. 최종 확정본처럼 깔끔하게 작성하세요. 변경 이유나 변경 전/후 비교 없이, 완성된 세계관 설정만 서술하세요.",
        },
        {
          speaker: "character_designer",
          directive:
            "라운드 2에서 받은 피드백과 디렉터의 수정 지시를 반영하여 캐릭터를 수정/보강하세요. 특히 플롯과의 정합성, 세계관과의 일관성에 집중하세요. 최종 확정본처럼 깔끔하게 작성하세요. 변경 이유나 메타 설명 없이, 완성된 캐릭터 설정만 서술하세요.",
        },
        {
          speaker: "plot_architect",
          directive:
            "라운드 2 피드백을 반영하여 플롯을 수정하세요. 시스템 디자이너의 페이싱 피드백, 수정된 캐릭터/세계관을 반영하세요. 메인 퀘스트 흐름, 분기점, 엔딩 분기를 확정하세요. 변경 이유나 메타 설명 없이, 완성된 플롯만 서술하세요.",
        },
        {
          speaker: "quest_designer",
          directive:
            "수정된 플롯/세계관/캐릭터/시스템을 바탕으로 구체적인 퀘스트를 설계하세요. 메인 퀘스트 5개 이상, 서브 퀘스트 3개 이상. 각 퀘스트의 목표, 과정, 보상, 연결 관계를 정의하세요. 시스템 디자이너의 성장/경제 시스템과 보상이 연동되도록 하세요. 변경 이유나 메타 설명 없이, 완성된 퀘스트 설계만 서술하세요.",
        },
        {
          speaker: "systems_designer",
          directive:
            "수정된 세계관/캐릭터/플롯/퀘스트를 반영하여 게임 시스템을 확정하세요. 핵심 루프, 성장 곡선, 난이도 곡선, 경제 밸런스를 구체적 수치와 함께 제시하세요. 퀘스트 보상과 성장 시스템의 연동을 확인하세요. 변경 이유나 메타 설명 없이, 완성된 시스템 설계만 서술하세요.",
        },
        {
          speaker: "dialogue_writer",
          directive:
            "확정된 캐릭터/플롯/퀘스트를 바탕으로 핵심 장면 4개의 대사를 작성하세요: 1) 오프닝, 2) 핵심 반전, 3) 클라이맥스, 4) 엔딩 중 하나. 캐릭터별 말투를 차별화하고, 선택지 대사도 포함하세요. 변경 이유나 메타 설명 없이, 완성된 대사본만 서술하세요.",
        },
      ],
    },

    // ── 자기 검증 (Reflection) ──
    {
      name: "🔍 자기 검증",
      description: "각 에이전트가 자기 결과물을 비판적으로 재검토하고 개선합니다",
      model: "claude-sonnet-4-6",
      discussions: [
        {
          speaker: "world_builder",
          directive:
            "라운드 3에서 작성한 당신의 세계관을 비판적으로 재검토하세요. 다음을 점검하세요: 1) 다른 에이전트 작업과 모순은 없는가? 2) 구체적 디테일이 부족한 부분은? 3) 플레이어 관점에서 탐험 동기가 약한 부분은? 발견된 약점을 보강하여 개선된 최종본을 작성하세요. 변경 이유 없이 완성본만 서술하세요.",
        },
        {
          speaker: "character_designer",
          directive:
            "라운드 3에서 작성한 당신의 캐릭터를 비판적으로 재검토하세요. 다음을 점검하세요: 1) 캐릭터 간 관계와 갈등이 충분히 입체적인가? 2) 성장 아크가 플롯과 맞물리는가? 3) 각 캐릭터가 고유한 매력을 가지는가? 발견된 약점을 보강하여 개선된 최종본을 작성하세요. 변경 이유 없이 완성본만 서술하세요.",
        },
        {
          speaker: "plot_architect",
          directive:
            "라운드 3에서 작성한 당신의 플롯을 비판적으로 재검토하세요. 다음을 점검하세요: 1) 기승전결의 리듬과 긴장감은 적절한가? 2) 분기점에서 선택이 진정한 딜레마를 제공하는가? 3) 엔딩이 만족스러운 카타르시스를 주는가? 발견된 약점을 보강하여 개선된 최종본을 작성하세요. 변경 이유 없이 완성본만 서술하세요.",
        },
        {
          speaker: "quest_designer",
          directive:
            "라운드 3에서 작성한 당신의 퀘스트를 비판적으로 재검토하세요. 다음을 점검하세요: 1) 퀘스트 목표가 다양한가, 단조롭지 않은가? 2) 보상이 성장 시스템과 실제로 연동되는가? 3) 퀘스트 흐름이 스토리와 자연스럽게 이어지는가? 발견된 약점을 보강하여 개선된 최종본을 작성하세요. 변경 이유 없이 완성본만 서술하세요.",
        },
        {
          speaker: "systems_designer",
          directive:
            "라운드 3에서 작성한 당신의 시스템을 비판적으로 재검토하세요. 다음을 점검하세요: 1) 핵심 루프가 중독성 있는가? 2) 수치 밸런스에 허점은 없는가? 3) 성장 곡선이 플레이어 이탈 없이 동기를 유지하는가? 발견된 약점을 보강하여 개선된 최종본을 작성하세요. 변경 이유 없이 완성본만 서술하세요.",
        },
        {
          speaker: "dialogue_writer",
          directive:
            "라운드 3에서 작성한 당신의 대사를 비판적으로 재검토하세요. 다음을 점검하세요: 1) 각 캐릭터의 말투가 확실히 차별화되는가? 2) 감정적 임팩트가 충분한가? 3) 선택지 대사가 플레이어에게 의미 있는 선택으로 느껴지는가? 발견된 약점을 보강하여 개선된 최종본을 작성하세요. 변경 이유 없이 완성본만 서술하세요.",
        },
      ],
    },

    // ── 라운드 4: 최종 통합 ──
    {
      name: "📑 라운드 4: 최종 통합",
      description: "디렉터가 모든 결과를 검증하고 최종 기획서를 작성합니다",
      model: "claude-sonnet-4-6",
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
        discussion.directive,
        round.model
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

  // 최종 문서 구성: 라운드4 개요 + 자기검증 상세 전문
  const r4 = allMessages.filter((m) => m.phase === "📑 라운드 4: 최종 통합");
  const r3 = allMessages.filter((m) => m.phase === "🔍 자기 검증");

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

  // 캐릭터 관계도 추출 (gpt-4o-mini로 저비용)
  let relationships: CharacterRelationship[] = [];
  try {
    const characterSection = r3.find((m) => m.role === "character_designer");
    const plotSection = r3.find((m) => m.role === "plot_architect");
    const extractionInput = [
      characterSection?.content || "",
      plotSection?.content || "",
    ].join("\n\n");

    if (extractionInput.trim()) {
      const extractionConfig = {
        ...getAgentConfig("director"),
        temperature: 0.1,
        systemPrompt: "당신은 텍스트에서 구조화된 데이터를 추출하는 전문가입니다. 반드시 유효한 JSON만 출력하세요. 다른 텍스트는 절대 포함하지 마세요.",
      };

      const extractionResult = await runAgent(
        extractionConfig,
        "",
        [],
        `다음 게임 기획서에서 캐릭터 간 관계를 추출하여 JSON 배열로 출력하세요.

형식 (이 형식만 출력, 다른 텍스트 금지):
[{"from":"캐릭터A","to":"캐릭터B","relation":"관계설명","type":"ally"},...]

type은 반드시 다음 중 하나: "ally", "enemy", "neutral", "romantic", "family"

텍스트:
${extractionInput}`,
        "gpt-4o-mini"
      );

      const jsonMatch = extractionResult.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        relationships = JSON.parse(jsonMatch[0]);
      }
    }
  } catch {
    // 관계 추출 실패해도 기획서는 정상 출력
  }

  yield {
    type: "complete",
    finalDocument: finalDoc,
    relationships,
  };
}
