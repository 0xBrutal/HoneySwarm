const { evaluateEvent } = require('../detection-engine/detector');

function recordEvent(db, sessionId, event, state = null, io = null) {
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
    
    event.id = info.lastInsertRowid;
    const timestamp = new Date().toISOString();

    // Run deterministic detection engine (updates threat scores and MITRE mappings)
    if (sessionId && db) {
      evaluateEvent(db, sessionId, event, state);
    }

    // Broadcast real-time update to connected Defenders
    if (io && sessionId) {
      io.emit('new_event', {
        sessionId,
        event: {
          id: event.id,
          event_type: event.eventType,
          action: event.action,
          description: event.description,
          severity: event.severity,
          timestamp,
        }
      });
      
      // Broadcast updated session metrics (threat score/routing stage)
      const session = db.prepare('SELECT threat_score, routing_stage FROM sessions WHERE id = ?').get(sessionId);
      if (session) {
        io.emit('session_updated', { 
          sessionId, 
          threat_score: session.threat_score, 
          routing_stage: session.routing_stage 
        });
      }
    }
  } catch (err) {
    console.error('[Recorder] Failed to record event:', err.message);
  }
}

module.exports = { recordEvent };

