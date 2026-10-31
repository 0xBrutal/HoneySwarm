const { mapEventToMitre } = require('../threat-classifier/mitreMapper');

function getSessionIntelligence(req, res) {
  const db = req.app.get('db');
  const { sessionId } = req.params;

  const session = db.prepare('SELECT id, visitor_id, threat_score, routing_stage, status, started_at, last_activity_at FROM sessions WHERE id = ?').get(sessionId);
  if (!session) return res.status(404).json({ message: 'Session not found' });

  const intel = db.prepare('SELECT * FROM threat_intelligence WHERE session_id = ?').get(sessionId);
  const events = db.prepare('SELECT * FROM events WHERE session_id = ? ORDER BY timestamp DESC LIMIT 100').all(sessionId);

  const mitreMap = {};
  for (const ev of events) {
    const techniques = mapEventToMitre({ ...ev, metadata: JSON.parse(ev.metadata || '{}') });
    for (const t of techniques) {
      if (!mitreMap[t.id]) {
        mitreMap[t.id] = { ...t, evidence: [], confidence: 0.9 };
      }
      mitreMap[t.id].evidence.push(ev.id);
    }
  }

  res.json({
    session,
    intelligence: intel || null,
    events,
    mitreTechniques: Object.values(mitreMap),
  });
}

function getAllSessions(req, res) {
  const db = req.app.get('db');
  const sessions = db.prepare('SELECT id, visitor_id, session_type, routing_stage, threat_score, status, started_at, last_activity_at FROM sessions ORDER BY last_activity_at DESC').all();
  res.json({ sessions });
}

module.exports = { getSessionIntelligence, getAllSessions };
