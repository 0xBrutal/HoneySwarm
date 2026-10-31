const scenarioRunner = require('../services/scenarioRunner');
const { recordEvent } = require('../event-recorder/recorder');
const { createInitialState } = require('../simulation-engine/worldState');

function startScenario(req, res) {
  const result = scenarioRunner.start(req.app);
  if (result.error) return res.status(409).json({ message: result.error });
  res.status(201).json(result);
}

function pauseScenario(req, res) {
  const result = scenarioRunner.pause();
  if (result.error) return res.status(409).json({ message: result.error });
  res.json(result);
}

function resumeScenario(req, res) {
  const result = scenarioRunner.resume();
  if (result.error) return res.status(409).json({ message: result.error });
  res.json(result);
}

function stopScenario(req, res) {
  const result = scenarioRunner.stop();
  if (result.error) return res.status(409).json({ message: result.error });
  res.json(result);
}

function scenarioStatus(req, res) {
  res.json(scenarioRunner.getStatus());
}

function resetSession(req, res) {
  const db = req.app.get('db');
  const { sessionId } = req.params;

  try {
    // Delete related records (since we didn't use ON DELETE CASCADE in schema)
    db.prepare('DELETE FROM events WHERE session_id = ?').run(sessionId);
    db.prepare('DELETE FROM simulation_state WHERE session_id = ?').run(sessionId);
    db.prepare('DELETE FROM threat_intelligence WHERE session_id = ?').run(sessionId);
    db.prepare('DELETE FROM decoys WHERE session_id = ?').run(sessionId);
    db.prepare('DELETE FROM reports WHERE session_id = ?').run(sessionId);

    // Delete the session itself
    const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);

    if (result.changes === 0) return res.status(404).json({ message: 'Session not found' });

    res.json({ message: 'Session reset successfully' });
  } catch (err) {
    console.error('[Management] Reset failed:', err.message);
    res.status(500).json({ message: 'Reset failed' });
  }
}

function resetAllSessions(req, res) {
  const db = req.app.get('db');
  try {
    db.prepare('DELETE FROM events').run();
    db.prepare('DELETE FROM simulation_state').run();
    db.prepare('DELETE FROM threat_intelligence').run();
    db.prepare('DELETE FROM decoys').run();
    db.prepare('DELETE FROM reports').run();
    db.prepare('DELETE FROM sessions').run();

    // Also stop any running scenario
    if (scenarioRunner.getStatus().status === 'running' || scenarioRunner.getStatus().status === 'paused') {
      scenarioRunner.stop();
    }

    res.json({ message: 'All demo sessions and data reset successfully' });
  } catch (err) {
    console.error('[Management] Reset all failed:', err.message);
    res.status(500).json({ message: 'Reset all failed' });
  }
}

function emergencyStop(req, res) {
  const db = req.app.get('db');
  try {
    // 1. Stop the automated scenario
    scenarioRunner.stop();

    // 2. Mark all active sessions as closed to prevent further interaction
    db.prepare("UPDATE sessions SET status = 'closed' WHERE status = 'active'").run();

    const io = req.app.get('io');
    if (io) io.emit('emergency_stop', { message: 'Emergency stop activated by defender.' });

    res.json({ message: 'Emergency stop executed. Scenario halted, active sessions closed.' });
  } catch (err) {
    console.error('[Management] Emergency stop failed:', err.message);
    res.status(500).json({ message: 'Emergency stop failed' });
  }
}

module.exports = {
  startScenario, pauseScenario, resumeScenario, stopScenario, scenarioStatus,
  resetSession, resetAllSessions, emergencyStop
};