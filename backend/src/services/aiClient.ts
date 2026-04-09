export interface AIConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

async function callAnthropic(
  cfg: AIConfig,
  messages: Message[],
  maxTokens = 4096
): Promise<string> {
  const url = `${cfg.baseUrl.replace(/\/$/, '')}/v1/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: cfg.model, messages, max_tokens: maxTokens }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }
  const data = (await res.json()) as { content: { text: string }[] };
  return data.content[0]?.text ?? '';
}

async function callOpenAI(
  cfg: AIConfig,
  messages: Message[],
  maxTokens = 4096
): Promise<string> {
  const url = `${cfg.baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({ model: cfg.model, messages, max_tokens: maxTokens }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI-compatible API error ${res.status}: ${text}`);
  }
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message?.content ?? '';
}

export async function callAI(
  cfg: AIConfig,
  messages: Message[],
  maxTokens = 4096
): Promise<string> {
  if (cfg.provider === 'anthropic') {
    return callAnthropic(cfg, messages, maxTokens);
  }
  return callOpenAI(cfg, messages, maxTokens);
}

/** Try primary AI; on failure try fallback. */
export async function callWithFallback(
  primary: AIConfig,
  fallback: AIConfig,
  messages: Message[],
  maxTokens = 4096
): Promise<string> {
  try {
    return await callAI(primary, messages, maxTokens);
  } catch (err) {
    console.warn('[AI] Primary failed, trying fallback:', (err as Error).message);
    return callAI(fallback, messages, maxTokens);
  }
}

/** Extract JSON from possibly-markdown-wrapped AI response. */
export function extractJSON(raw: string): string {
  // strip ```json ... ``` fences
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // find first [ or { and last ] or }
  const start = raw.search(/[\[{]/);
  const endBracket = raw.lastIndexOf(']');
  const endBrace = raw.lastIndexOf('}');
  const end = Math.max(endBracket, endBrace);
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }
  return raw.trim();
}
