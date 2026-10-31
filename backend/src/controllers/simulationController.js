const { v4: uuidv4 } = require('uuid');
const { createInitialState } = require('../simulation-engine/worldState');
const fsUtils = require('../simulation-engine/filesystem');
const { recordEvent } = require('../event-recorder/recorder');
const simulationService = require('../services/simulationService');

function publicState(state) {
  return { currentUser: state.currentUser, privilege: state.privilege, cwd: state.cwd };
}

function createSession(req, res) {
  const db = req.app.get('db');
  const io = req.app.get('io');
  const sessionId = uuidv4();
  const visitorId = (req.body && req.body.visitorId) || `anon-${uuidv4().slice(0, 8)}`;
  const portalLogin = req.body && req.body.portalLogin;
  const state = createInitialState();

  db.prepare(`INSERT INTO sessions (id, visitor_id, session_type, routing_stage, threat_score, confidence, status)
              VALUES (?, ?, 'normal', 'observe', 0, 0, 'active')`).run(sessionId, visitorId);
  db.prepare('INSERT INTO simulation_state (session_id, state_json) VALUES (?, ?)')
    .run(sessionId, JSON.stringify(state));

  if (portalLogin && portalLogin.username) {
    recordEvent(db, sessionId, {
      eventType: 'portal_login',
      action: `portal login as '${portalLogin.username}'`,
      endpoint: '/api/simulation/session',
      description: `Employee portal login with Vertex ID '${portalLogin.username}'. Password value redacted.`,
      severity: 'info',
      source: 'session-manager',
      metadata: { submittedUser: portalLogin.username, passwordProvided: !!portalLogin.password },
    }, state, io);
  }

  res.status(201).json({ sessionId, routingStage: 'observe' });
}

function getSessionInfo(req, res) {
  const { session, state } = req.simContext;
  res.json({
    session: {
      id: session.id,
      routingStage: session.routing_stage,
      threatScore: session.threat_score,
      status: session.status,
    },
    state: {
      ...publicState(state),
      discoveredFileCount: state.discoveredFiles.length,
      credentialCount: state.knownCredentials.length,
      decoysTriggered: state.decoyAccessed.length,
    },
  });
}

async function terminal(req, res) {
  try {
    const { session, state } = req.simContext;
    const db = req.app.get('db');
    const io = req.app.get('io');
    const { command } = req.body || {};
    if (typeof command !== 'string') return res.status(400).json({ message: 'command (string) required' });

    const out = await simulationService.processTerminalCommand(db, io, session, state, command);
    res.json({ ...out, state: publicState(state) });
  } catch (err) {
    console.error('[Simulation] Terminal error:', err.message);
    res.status(500).json({ message: 'Terminal processing failed' });
  }
}

async function chat(req, res) {
  try {
    const { session, state } = req.simContext;
    const db = req.app.get('db');
    const io = req.app.get('io');
    const { message } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) return res.status(400).json({ message: 'message (string) required' });

    const out = await simulationService.processChatMessage(db, io, session, state, message);
    res.json(out);
  } catch (err) {
    console.error('[Simulation] Chat error:', err.message);
    res.status(500).json({ message: 'Chat processing failed' });
  }
}

function listFiles(req, res) {
  const { state } = req.simContext;
  const requested = req.query.path || state.cwd;
  const target = fsUtils.resolvePath(state, requested);
  const result = fsUtils.listDirectory(state, target);
  if (result.error) return res.status(403).json({ message: result.error });
  res.json({ path: result.path, entries: result.entries });
}

function fileContent(req, res) {
  const { session, state } = req.simContext;
  const db = req.app.get('db');
  const io = req.app.get('io');
  const requested = req.query.path;
  if (!requested) return res.status(400).json({ message: 'path query parameter required' });

  const target = fsUtils.resolvePath(state, requested);
  const result = fsUtils.readFile(state, target);
  if (result.error) return res.status(403).json({ message: result.error });

  if (!state.discoveredFiles.includes(target)) state.discoveredFiles.push(target);
  if (result.credential && !state.knownCredentials.some((c) => c.user === result.credential.user && c.source === result.credential.source)) {
    state.knownCredentials.push(result.credential);
  }
  if (result.decoy && !state.decoyAccessed.includes(target)) {
    state.decoyAccessed.push(target);
    recordEvent(db, session.id, {
      eventType: 'decoy_access', action: `open ${requested}`,
      description: `Decoy resource accessed via cloud drive: ${result.decoy.label}`,
      severity: 'high', source: 'simulation-engine',
      endpoint: '/api/simulation/file-content',
      metadata: { path: target, decoyType: result.decoy.type },
    }, state, io);
  }
  recordEvent(db, session.id, {
    eventType: 'file_read', action: `open ${requested}`,
    description: `Read file via cloud drive: ${target}`,
    severity: result.sensitive ? 'medium' : 'info', source: 'simulation-engine',
    endpoint: '/api/simulation/file-content',
    metadata: { path: target, sensitive: result.sensitive },
  }, state, io);

  simulationService.persistState(db, session.id, state);
  res.json({ path: target, name: target.split('/').pop(), content: result.content });
}

function directory(req, res) {
  const { state } = req.simContext;
  res.json({ employees: state.employees });
}

function adminPanel(req, res) {
  const { state } = req.simContext;
  if (state.privilege !== 'root' && state.privilege !== 'admin') {
    return res.json({
      restricted: true,
      message: 'Access restricted: insufficient privileges. Administrative access requires elevated clearance.',
    });
  }
  res.json({
    restricted: false,
    users: [
      { username: 'root', role: 'Superuser', status: 'active', lastLogin: '2026-10-31 08:12' },
      { username: 'dbishop', role: 'DevOps (sudo)', status: 'active', lastLogin: '2026-10-31 09:14' },
      { username: 'jmiller', role: 'IT Support', status: 'active', lastLogin: '2026-10-30 16:42' },
      { username: 'skhan', role: 'Finance', status: 'active', lastLogin: '2026-10-29 11:03' },
      { username: 'lchen', role: 'Human Resources', status: 'active', lastLogin: '2026-10-28 14:22' },
    ],
    config: {
      hostname: state.company.server,
      kernel: '5.15.0-91-generic',
      uptime: '6 days, 04:12',
      services: ['nginx 1.18.0 (running)', 'postgresql 14.9 (running)', 'sshd (running)', 'cron (running)'],
      pendingUpdates: 3,
    },
  });
}

module.exports = { createSession, getSessionInfo, terminal, chat, listFiles, fileContent, directory, adminPanel };
