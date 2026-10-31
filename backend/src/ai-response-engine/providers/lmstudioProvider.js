const TIMEOUT_MS = 30000;

async function complete(messages) {
  const baseUrl = process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234/v1';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.LM_STUDIO_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.LM_STUDIO_API_KEY}`;
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: process.env.LM_STUDIO_MODEL || 'local-model',
        messages,
        max_tokens: 600,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`LM Studio HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('LM Studio returned empty content');
    return content;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`LM Studio request timed out (${TIMEOUT_MS}ms)`);
    throw new Error(`LM Studio unavailable: ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { complete };
