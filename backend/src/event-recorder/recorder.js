const { evaluateEvent } = require('../detection-engine/detector');

function recordEvent(db, sessionId, event, state = null) {
  try {
    const info = db.prepare(`
      INSERT INTO events (session_id, event_type, action, endpoint, description, severity, source, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId,
      event.eventType || 'unknown',
      event.action || null,
      event.endpoint || null,
      event.description || null,
      event.severity || 'info',
      event.source || 'system',
      JSON.stringify(event.metadata || {})
    );
    
    // Attach DB-generated ID to the event for MITRE mapping
    event.id = info.lastInsertRowid;

    // Run detection engine
    if (sessionId && db) {
      evaluateEvent(db, sessionId, event, state);
    }
  } catch (err) {
    console.error('[Recorder] Failed to record event:', err.message);
  }
}

module.exports = { recordEvent };
