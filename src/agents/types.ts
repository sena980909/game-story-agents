export type AgentRole =
  | "director"
  | "world_builder"
  | "character_designer"
  | "plot_architect"
  | "quest_designer"
  | "dialogue_writer"
  | "systems_designer";

export interface AgentMessage {
  role: AgentRole;
  agentName: string;
  content: string;
  timestamp: number;
  phase: string;
  targetAgent?: AgentRole;
}

export interface AgentConfig {
  role: AgentRole;
  name: string;
  emoji: string;
  title: string;
  description: string;
  systemPrompt: string;
  temperature: number;
}

export interface StoryRequest {
  genre: string;
  theme: string;
  setting: string;
  additionalNotes?: string;
}

export interface CharacterRelationship {
  from: string;
  to: string;
  relation: string;
  type: "ally" | "enemy" | "neutral" | "romantic" | "family";
}

export interface OrchestratorEvent {
  type: "agent_start" | "agent_message" | "agent_done" | "phase_change" | "complete" | "error";
  agent?: AgentRole;
  targetAgent?: AgentRole;
  agentName?: string;
  targetAgentName?: string;
  emoji?: string;
  phase?: string;
  content?: string;
  finalDocument?: string;
  relationships?: CharacterRelationship[];
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  request: StoryRequest;
  finalDocument: string;
  relationships?: CharacterRelationship[];
}
