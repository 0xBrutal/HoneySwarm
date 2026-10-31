const groqProvider = require('./providers/groqProvider');
const lmstudioProvider = require('./providers/lmstudioProvider');

const status = {
  mode: (process.env.AI_PROVIDER || 'groq').toLowerCase(),
  activeProvider: 'none',
  groq: {
    configured: !!process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    lastStatus: 'untested',
    lastError: null,
    lastUsedAt: null,
  },
  lmstudio: {
    baseUrl: process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234/v1',
    model: process.env.LM_STUDIO_MODEL || 'local-model',
    lastStatus: 'untested',
    lastError: null,
    lastUsedAt: null,
  },
  deterministic: { available: true },
  recentErrors: [],
};

function logError(provider, message) {
  status.recentErrors.unshift({ provider, message, timestamp: new Date().toISOString() });
  if (status.recentErrors.length > 10) status.recentErrors.pop();
}

function buildChain() {
  const mode = (process.env.AI_PROVIDER || 'groq').toLowerCase();
  if (mode === 'deterministic') return [];
  if (mode === 'lmstudio') return ['lmstudio'];
  if (mode === 'groq') return ['groq', 'lmstudio'];
  return ['groq', 'lmstudio'];
}

async function callProvider(name, messages) {
  if (name === 'groq') return groqProvider.complete(messages);
  if (name === 'lmstudio') return lmstudioProvider.complete(messages);
  throw new Error(`Unknown provider: ${name}`);
}

/**
 * Attempts providers in priority order.
 * NEVER throws: returns { provider: 'deterministic', content: null } when all fail.
 */
async function complete(messages) {
  const chain = buildChain();
  for (const name of chain) {
    try {
      const content = await callProvider(name, messages);
      status.activeProvider = name;
      status[name].lastStatus = 'ok';
      status[name].lastError = null;
      status[name].lastUsedAt = new Date().toISOString();
      return { provider: name, content };
    } catch (err) {
      status[name].lastStatus = 'error';
      status[name].lastError = err.message;
      logError(name, err.message);
      console.warn(`[AI] Provider '${name}' failed, trying next: ${err.message}`);
    }
  }
  status.activeProvider = 'deterministic';
  return { provider: 'deterministic', content: null };
}

function reportValidationError(provider, message) {
  logError(provider, `Output validation failed: ${message}`);
}

function getStatus() {
  return {
    mode: status.mode,
    activeProvider: status.activeProvider,
    groq: status.groq,
    lmstudio: status.lmstudio,
    deterministic: status.deterministic,
    recentErrors: status.recentErrors.slice(0, 5),
  };
}

module.exports = { complete, getStatus, reportValidationError };
