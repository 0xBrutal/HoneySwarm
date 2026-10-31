const TIMEOUT_MS = 20000;

async function complete(messages) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Groq API key not configured');

  const baseUrl = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 512,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Groq HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Groq returned empty content');
    return content;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`Groq request timed out (${TIMEOUT_MS}ms)`);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { complete };
