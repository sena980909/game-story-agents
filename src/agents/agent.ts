import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { AgentConfig, AgentMessage } from "./types";

const openaiClient = new OpenAI();
const anthropicClient = new Anthropic();

function isClaude(model: string): boolean {
  return model.startsWith("claude-");
}

export async function runAgent(
  config: AgentConfig,
  userRequest: string,
  previousMessages: AgentMessage[],
  directive: string,
  model: string = "gpt-4o"
): Promise<string> {
  const contextMessages = previousMessages.map(
    (m) => `[${m.agentName}] (${m.phase})\n${m.content}`
  );

  const contextBlock =
    contextMessages.length > 0
      ? `\n\n=== 이전 에이전트들의 작업 결과 ===\n${contextMessages.join("\n\n---\n\n")}\n=== 끝 ===`
      : "";

  const userContent = `## 유저 요청\n${userRequest}${contextBlock}\n\n## 현재 지시사항\n${directive}\n\n위 내용을 바탕으로 당신의 전문 분야에 해당하는 작업을 수행해주세요.`;

  try {
    if (isClaude(model)) {
      const response = await anthropicClient.messages.create({
        model,
        max_tokens: 2048,
        temperature: config.temperature,
        system: config.systemPrompt,
        messages: [
          {
            role: "user",
            content: userContent,
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error(`${config.name} 에이전트로부터 빈 응답을 받았습니다.`);
      }
      return textBlock.text;
    } else {
      const response = await openaiClient.chat.completions.create({
        model,
        max_tokens: 2048,
        temperature: config.temperature,
        messages: [
          {
            role: "system",
            content: config.systemPrompt,
          },
          {
            role: "user",
            content: userContent,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error(`${config.name} 에이전트로부터 빈 응답을 받았습니다.`);
      }
      return content;
    }
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(
        `${config.name} OpenAI 오류 (${error.status}): ${error.message}`
      );
    }
    if (error instanceof Anthropic.APIError) {
      throw new Error(
        `${config.name} Claude 오류 (${error.status}): ${error.message}`
      );
    }
    throw new Error(
      `${config.name} 실행 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
    );
  }
}
