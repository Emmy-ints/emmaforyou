import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "./run-id.ts";
import type { AiProvider } from "./provider";

/**
 * One streamed call to the OpenAI Responses API, either directly (provider "openai") or through
 * Lovable's AI gateway (provider "lovable"). Server-only.
 */
export function createResponsesCall(
  request: Request,
  config: { provider: AiProvider; model?: string; onResponse?: (response: Response) => Promise<void> },
  messages: ModelMessage[],
  instructions?: string,
) {
  const { provider } = config;
  const model = config.model || provider.model;
  const isLovable = provider.id === "lovable";
  const runIdFetch = isLovable ? createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request)) : null;
  const openai = createOpenAI({
    baseURL: `${provider.baseURL.replace(/\/+$/, "").replace(/\/v1$/, "")}/v1`,
    apiKey: provider.apiKey,
    headers: provider.headers,
    fetch: async (input, init) => {
      const response = runIdFetch ? await runIdFetch.fetch(input, init) : await fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(120000) });
      await config.onResponse?.(response);
      return response;
    },
  });
  // GPT-5/6 family models accept a reasoning effort; older chat models don't.
  const reasoning = model !== "openai/chat-latest" && /(^|\/)(gpt-5|gpt-6|o\d)/i.test(model);
  const result = streamText({
    model: openai.responses(model),
    // AI SDK 6 lacks `instructions`: rename this key to `system` there.
    ...(instructions ? { instructions } : {}),
    messages,
    maxRetries: 0,
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        store: false,
        ...(reasoning
          ? isLovable
            ? { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] }
            : { reasoningEffort: "low" }
          : {}),
      },
    },
  });
  return {
    result,
    response: () => {
      const res = result.toUIMessageStreamResponse({ sendReasoning: isLovable });
      return runIdFetch ? withLovableAiGatewayRunIdHeader(res, runIdFetch) : res;
    },
  };
}
