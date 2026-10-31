function recordEvent(db, sessionId, event) {
  try {
    db.prepare(`
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
  } catch (err) {
    console.error('[Recorder] Failed to record event:', err.message);
  }
}

module.exports = { recordEvent };
