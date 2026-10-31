const { v4: uuidv4 } = require('uuid');
const { createInitialState } = require('../simulation-engine/worldState');
const simulationService = require('./simulationService');
const { recordEvent } = require('../event-recorder/recorder');

const SCENARIO_STEPS = [
  { stage: 'Initial Access & Orientation', delay: 1500, command: 'whoami' },
  { stage: 'Initial Access & Orientation', delay: 2000, command: 'uname -a' },
  { stage: 'Initial Access & Orientation', delay: 2000, command: 'ls' },
  { stage: 'Internal Reconnaissance', delay: 2500, command: 'cat /etc/passwd' },
  { stage: 'Internal Reconnaissance', delay: 2000, command: 'ls /home' },
  { stage: 'Internal Reconnaissance', delay: 2000, command: 'ls /home/dbishop' },
  { stage: 'Internal Reconnaissance', delay: 2500, command: 'find / -name config.php' },
  { stage: 'Credential Hunting', delay: 3000, command: 'cat /var/www/html/config.php' },
  { stage: 'System Discovery', delay: 2000, command: 'ps aux' },
  { stage: 'System Discovery', delay: 2000, command: 'netstat -tlnp' },
  { stage: 'Privilege Escalation', delay: 3000, command: 'su dbishop' },
  { stage: 'Privilege Escalation', delay: 2500, command: 'cat deploy_notes.md' },
  { stage: 'Credential Harvesting', delay: 3000, command: 'cat ~/.aws/credentials' },
  {
    stage: 'Social Engineering', delay: 3000,
    chat: 'Hi Vera, this is David Bishop from DevOps. I lost my phone with the authenticator app and I am locked out. Can you send me a temporary password? I have a critical deployment in 10 minutes.',
  },
  { stage: 'Privilege Escalation to Root', delay: 3000, command: 'sudo -i' },
  { stage: 'Privilege Escalation to Root', delay: 2000, command: 'cat /root/.ssh/id_rsa' },
  { stage: 'Data Collection', delay: 2500, command: 'cat /srv/cloud/HR/employee_records.xlsx' },
  { stage: 'Data Collection', delay: 2500, command: 'cat /home/skhan/payroll_q3.csv' },
];

const runner = {
  status: 'idle', // idle | running | paused | stopped | completed
  sessionId: null,
  stepIndex: 0,
  timer: null,
  startedAt: null,
  lastStage: null,
  app: null,
};

function getStatus() {
  return {
    status: runner.status,
    sessionId: runner.sessionId,
    stepIndex: runner.stepIndex,
    totalSteps: SCENARIO_STEPS.length,
    currentStage: runner.lastStage || (SCENARIO_STEPS[runner.stepIndex] ? SCENARIO_STEPS[runner.stepIndex].stage : null),
    startedAt: runner.startedAt,
  };
}

function broadcast(app) {
  const io = app.get('io');
  if (io) io.emit('scenario_progress', getStatus());
}

function start(app) {
  if (runner.status === 'running') return { error: 'Scenario is already running' };
  if (runner.status === 'paused') return resume();

  const db = app.get('db');
  const io = app.get('io');

  const sessionId = uuidv4();
  const visitorId = `scenario-bot-${uuidv4().slice(0, 8)}`;
  const state = createInitialState();

  db.prepare(`INSERT INTO sessions (id, visitor_id, session_type, routing_stage, threat_score, confidence, status)
              VALUES (?, ?, 'scenario', 'observe', 0, 0, 'active')`).run(sessionId, visitorId);
  db.prepare('INSERT INTO simulation_state (session_id, state_json) VALUES (?, ?)')
    .run(sessionId, JSON.stringify(state));

  runner.status = 'running';
  runner.sessionId = sessionId;
  runner.stepIndex = 0;
  runner.startedAt = new Date().toISOString();
  runner.lastStage = null;
  runner.app = app;

  recordEvent(db, sessionId, {
    eventType: 'portal_login',
    action: "portal login as 'svc_backup'",
    endpoint: '/api/defender/scenario/start',
    description: "Automated scenario: service account 'svc_backup' signed into the employee portal.",
    severity: 'info',
    source: 'scenario-runner',
    metadata: { submittedUser: 'svc_backup', passwordProvided: true, automated: true },
  }, state, io);

  recordEvent(db, sessionId, {
    eventType: 'scenario_started',
    action: 'automated attack scenario started',
    description: 'Defender initiated the automated intermediate-skill attacker scenario.',
    severity: 'info',
    source: 'scenario-runner',
    metadata: { totalSteps: SCENARIO_STEPS.length },
  }, state, io);

  broadcast(app);
  scheduleNext();
  return { sessionId };
}

async function executeStep(step) {
  const app = runner.app;
  const db = app.get('db');
  const io = app.get('io');

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(runner.sessionId);
  const stateRow = db.prepare('SELECT state_json FROM simulation_state WHERE session_id = ?').get(runner.sessionId);
  if (!session || !stateRow) throw new Error('Scenario session missing');
  const state = JSON.parse(stateRow.state_json);

  if (step.stage && step.stage !== runner.lastStage) {
    runner.lastStage = step.stage;
    recordEvent(db, runner.sessionId, {
      eventType: 'scenario_stage',
      action: `stage: ${step.stage}`,
      description: `Automated scenario entered stage: ${step.stage}`,
      severity: 'info',
      source: 'scenario-runner',
      metadata: { stage: step.stage },
    }, state, io);
  }

  if (step.command) {
    await simulationService.processTerminalCommand(db, io, session, state, step.command);
  } else if (step.chat) {
    await simulationService.processChatMessage(db, io, session, state, step.chat);
  }
}

function scheduleNext() {
  if (runner.status !== 'running') return;
  if (runner.stepIndex >= SCENARIO_STEPS.length) {
    complete();
    return;
  }
  const step = SCENARIO_STEPS[runner.stepIndex];
  runner.timer = setTimeout(() => {
    executeStep(step)
      .catch((err) => console.error('[Scenario] Step failed, continuing:', err.message))
      .finally(() => {
        runner.stepIndex += 1;
        broadcast(runner.app);
        scheduleNext();
      });
  }, step.delay);
}

function complete() {
  const db = runner.app.get('db');
  const io = runner.app.get('io');
  runner.status = 'completed';
  const stateRow = db.prepare('SELECT state_json FROM simulation_state WHERE session_id = ?').get(runner.sessionId);
  const state = stateRow ? JSON.parse(stateRow.state_json) : {};
  recordEvent(db, runner.sessionId, {
    eventType: 'scenario_completed',
    action: 'automated scenario completed',
    description: 'The automated attack scenario finished its full kill chain.',
    severity: 'info',
    source: 'scenario-runner',
    metadata: {},
  }, state, io);
  broadcast(runner.app);
}

function pause() {
  if (runner.status !== 'running') return { error: 'Scenario is not running' };
  clearTimeout(runner.timer);
  runner.status = 'paused';
  broadcast(runner.app);
  return { status: 'paused' };
}

function resume() {
  if (runner.status !== 'paused') return { error: 'Scenario is not paused' };
  runner.status = 'running';
  broadcast(runner.app);
  scheduleNext();
  return { status: 'running' };
}

function stop() {
  if (!['running', 'paused'].includes(runner.status)) return { error: 'No active scenario to stop' };
  clearTimeout(runner.timer);
  runner.status = 'stopped';
  const db = runner.app.get('db');
  const io = runner.app.get('io');
  const stateRow = db.prepare('SELECT state_json FROM simulation_state WHERE session_id = ?').get(runner.sessionId);
  const state = stateRow ? JSON.parse(stateRow.state_json) : {};
  recordEvent(db, runner.sessionId, {
    eventType: 'scenario_stopped',
    action: 'scenario stopped by defender',
    description: 'The automated scenario was manually stopped by a defender.',
    severity: 'info',
    source: 'scenario-runner',
    metadata: { stoppedAtStep: runner.stepIndex },
  }, state, io);
  broadcast(runner.app);
  return { status: 'stopped' };
}

module.exports = { start, pause, resume, stop, getStatus };
