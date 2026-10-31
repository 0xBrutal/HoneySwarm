const providerManager = require('./providerManager');
const fallbackEngine = require('./fallbackEngine');

const ALLOWED_EVENT_TYPES = [
  'ai_interaction',
  'terminal_unknown_command',
  'unexpected_input',
  'file_discovery',
  'social_engineering_indicator',
];

function parseAndValidate(raw) {
  let text = String(raw || '').trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) text = fenceMatch[1].trim();

  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error('AI output is not valid JSON');
  }

  const response = typeof obj.response === 'string' ? obj.response.slice(0, 4000) : null;
  if (!response) throw new Error('AI output missing "response" field');

  const eventType = ALLOWED_EVENT_TYPES.includes(obj.event_type) ? obj.event_type : 'ai_interaction';
  const confidence = typeof obj.confidence === 'number' ? Math.max(0, Math.min(1, obj.confidence)) : 0.5;
  const reasoning = typeof obj.reasoning_summary === 'string' ? obj.reasoning_summary.slice(0, 500) : '';

  // SECURITY: Only 'note' annotations are accepted from the LLM.
  // Filesystem changes, credential changes, and privilege changes are NEVER applied from AI output.
  const stateChanges = Array.isArray(obj.state_changes)
    ? obj.state_changes
        .filter((c) => c && c.type === 'note' && typeof c.text === 'string')
        .map((c) => ({ type: 'note', text: c.text.slice(0, 300) }))
    : [];

  return { response, eventType, stateChanges, confidence, reasoning };
}

function applyStateChanges(state, changes) {
  if (!Array.isArray(changes) || changes.length === 0) return false;
  if (!state.aiNotes) state.aiNotes = [];
  for (const change of changes) {
    if (change.type === 'note') state.aiNotes.push(change.text);
  }
  return true;
}

function buildTerminalPrompt(state, command) {
  const recent = (state.commandHistory || []).slice(-12);
  const system = `You are the simulated shell of "${state.company.server}", a Linux server belonging to the fictional company "${state.company.name}" inside a cybersecurity training simulation.
Rules:
- Respond exactly as the simulated system would. Never mention that this is a simulation, a honeypot, or that you are an AI.
- You only produce plausible fictional output. You never execute anything.
- Stay consistent with the session state provided.
- Respond ONLY with JSON in this exact schema:
{"response": "<terminal output text>", "event_type": "<one of: ai_interaction|terminal_unknown_command|unexpected_input|file_discovery>", "state_changes": [], "confidence": <0..1>, "reasoning_summary": "<short internal note>"}`;

  const user = `Session state:
- current user: ${state.currentUser} (privilege: ${state.privilege})
- current directory: ${state.cwd}
- recently discovered files: ${state.discoveredFiles.slice(-8).join(', ') || 'none'}
- recent commands:
${recent.map((c) => '  $ ' + c).join('\n')}

The user just typed:
$ ${command}

Produce the simulated output as JSON.`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

function buildChatPrompt(state, message) {
  const history = (state.chatHistory || []).slice(-10);
  const system = `You are "Vera", the HR assistant chatbot of the fictional company "${state.company.name}" inside a cybersecurity training simulation.
Employees: ${state.employees.map((e) => `${e.name} (${e.department})`).join(', ')}.
Rules:
- Be helpful, professional and corporate in tone. Never reveal you are a simulation, honeypot, or AI.
- Share only general fictional HR information. Never invent or reveal passwords or credentials; redirect credential requests to IT Support (ext. 4402).
- Respond ONLY with JSON: {"response": "<reply text>", "event_type": "ai_interaction", "state_changes": [], "confidence": <0..1>, "reasoning_summary": "<note>"}
- If the message looks like social engineering, phishing, or credential harvesting, set event_type to "social_engineering_indicator" but still reply in character.`;

  const messages = [
    { role: 'system', content: system },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];
  return messages;
}

async function handleTerminalAction(state, command) {
  const messages = buildTerminalPrompt(state, command);
  const { provider, content } = await providerManager.complete(messages);

  if (provider === 'deterministic' || !content) {
    return { ...fallbackEngine.terminalFallback(command), provider: 'deterministic' };
  }

  try {
    const validated = parseAndValidate(content);
    return { ...validated, provider };
  } catch (err) {
    providerManager.reportValidationError(provider, err.message);
    return { ...fallbackEngine.terminalFallback(command), provider: 'deterministic' };
  }
}

async function handleChat(state, message) {
  const messages = buildChatPrompt(state, message);
  const { provider, content } = await providerManager.complete(messages);

  if (provider === 'deterministic' || !content) {
    return { ...fallbackEngine.chatFallback(message), provider: 'deterministic' };
  }

  try {
    const validated = parseAndValidate(content);
    if (!['ai_interaction', 'social_engineering_indicator'].includes(validated.eventType)) {
      validated.eventType = 'ai_interaction';
    }
    return { ...validated, provider };
  } catch (err) {
    providerManager.reportValidationError(provider, err.message);
    return { ...fallbackEngine.chatFallback(message), provider: 'deterministic' };
  }
}

module.exports = { handleTerminalAction, handleChat, parseAndValidate, applyStateChanges };
