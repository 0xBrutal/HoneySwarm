const { executeCommand } = require('../simulation-engine/terminalEngine');
const { recordEvent } = require('../event-recorder/recorder');
const aiEngine = require('../ai-response-engine/aiEngine');

function persistState(db, sessionId, state) {
  db.prepare('UPDATE simulation_state SET state_json = ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?')
    .run(JSON.stringify(state), sessionId);
  db.prepare('UPDATE sessions SET last_activity_at = CURRENT_TIMESTAMP WHERE id = ?').run(sessionId);
}

async function processTerminalCommand(db, io, session, state, command) {
  const result = executeCommand(state, command);
  let aiInfo = null;

  if (result.needsAI) {
    const aiResult = await aiEngine.handleTerminalAction(state, command);
    result.output = aiResult.response;
    aiInfo = { provider: aiResult.provider, confidence: aiResult.confidence };
    aiEngine.applyStateChanges(state, aiResult.stateChanges);
    result.events.push({
      eventType: aiResult.eventType,
      action: command,
      description: `AI-assisted terminal response (${aiResult.provider}). ${aiResult.reasoning}`.trim(),
      severity: 'info',
      source: `ai-response-engine:${aiResult.provider}`,
      metadata: { provider: aiResult.provider, confidence: aiResult.confidence },
    });
  }

  persistState(db, session.id, state);
  for (const ev of result.events) {
    recordEvent(db, session.id, { ...ev, endpoint: '/api/simulation/terminal' }, state, io);
  }

  return { output: result.output, events: result.events.map((e) => e.eventType), ai: aiInfo };
}

async function processChatMessage(db, io, session, state, message) {
  if (!state.chatHistory) state.chatHistory = [];

  const aiResult = await aiEngine.handleChat(state, message.trim());

  state.chatHistory.push({ role: 'user', content: message.trim().slice(0, 500) });
  state.chatHistory.push({ role: 'assistant', content: aiResult.response.slice(0, 500) });
  if (state.chatHistory.length > 20) state.chatHistory = state.chatHistory.slice(-20);
  aiEngine.applyStateChanges(state, aiResult.stateChanges);

  persistState(db, session.id, state);

  const isSE = aiResult.eventType === 'social_engineering_indicator';
  recordEvent(db, session.id, {
    eventType: isSE ? 'social_engineering_indicator' : 'chat_interaction',
    action: `chat: ${message.trim().slice(0, 120)}`,
    description: `HR chat via ${aiResult.provider}: "${message.trim().slice(0, 200)}"${isSE ? ' [AI flagged possible social engineering — hypothesis only]' : ''}`,
    severity: 'info',
    source: `ai-response-engine:${aiResult.provider}`,
    endpoint: '/api/simulation/chat',
    metadata: { provider: aiResult.provider, confidence: aiResult.confidence },
  }, state, io);

  return { reply: aiResult.response, provider: aiResult.provider };
}

module.exports = { processTerminalCommand, processChatMessage, persistState };
