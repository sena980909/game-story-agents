import { orchestrate } from "@/agents/orchestrator";
import { StoryRequest } from "@/agents/types";

export const maxDuration = 300;

export async function POST(req: Request) {
  let body: StoryRequest;
  try {
    body = await req.json();
  } catch {
    return new Response("잘못된 요청 형식입니다.", { status: 400 });
  }

  if (!body.genre || !body.theme || !body.setting) {
    return new Response("장르, 테마, 배경은 필수 입력값입니다.", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of orchestrate(body)) {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const errorEvent = {
          type: "error",
          content: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
