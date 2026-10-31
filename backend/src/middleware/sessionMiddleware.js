function loadSession(req, res, next) {
  const db = req.app.get('db');
  const sessionId = req.headers['x-session-id'] || (req.body && req.body.sessionId);
  if (!sessionId) return res.status(400).json({ message: 'x-session-id header required' });

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!session) return res.status(404).json({ message: 'Session not found' });

  const stateRow = db.prepare('SELECT state_json FROM simulation_state WHERE session_id = ?').get(sessionId);
  if (!stateRow) return res.status(404).json({ message: 'Session state missing' });

  req.simContext = { session, state: JSON.parse(stateRow.state_json) };
  next();
}

module.exports = { loadSession };
