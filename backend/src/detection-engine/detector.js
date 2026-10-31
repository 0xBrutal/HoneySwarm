const { mapEventToMitre } = require('../threat-classifier/mitreMapper');

const SCORE_WEIGHTS = {
  info: 0,
  medium: 5,
  high: 15,
  critical: 40,
};

function evaluateEvent(db, sessionId, event, state) {
  try {
    const scoreDelta = SCORE_WEIGHTS[event.severity] || 0;
    const session = db.prepare('SELECT threat_score, routing_stage FROM sessions WHERE id = ?').get(sessionId);
    if (!session) return;

    let newScore = session.threat_score + scoreDelta;
    if (newScore > 100) newScore = 100;

    // Progressive detection stages
    let newStage = session.routing_stage;
    if (newScore >= 70) newStage = 'deception';
    else if (newScore >= 30) newStage = 'probe';
    else newStage = 'observe';

    db.prepare('UPDATE sessions SET threat_score = ?, routing_stage = ? WHERE id = ?')
      .run(newScore, newStage, sessionId);

    const techniques = mapEventToMitre(event);

    if (techniques.length > 0 || scoreDelta > 0) {
      const existingIntel = db.prepare('SELECT id FROM threat_intelligence WHERE session_id = ?').get(sessionId);
      
      let skillEstimate = 'Unknown';
      if (newScore >= 70) skillEstimate = 'Intermediate - Demonstrates privilege escalation and credential harvesting';
      else if (newScore >= 30) skillEstimate = 'Novice/Intermediate - Conducting active reconnaissance';
      else skillEstimate = 'Novice - Initial access and basic enumeration';

      let objective = 'Unknown';
      if (techniques.some(t => t.id.startsWith('T1552'))) objective = 'Credential Harvesting';
      else if (techniques.some(t => t.id.startsWith('T1087') || t.id.startsWith('T1083'))) objective = 'Internal Reconnaissance';
      
      const techIds = techniques.map(t => t.id).join(', ');

      if (existingIntel) {
        db.prepare(`
          UPDATE threat_intelligence 
          SET skill_estimate = ?, objective_estimate = ?, threat_summary = ?, confidence = ?
          WHERE session_id = ?
        `).run(skillEstimate, objective, techIds, Math.min(newScore / 100, 1.0), sessionId);
      } else {
        db.prepare(`
          INSERT INTO threat_intelligence (session_id, objective_estimate, skill_estimate, threat_summary, confidence)
          VALUES (?, ?, ?, ?, ?)
        `).run(sessionId, objective, skillEstimate, techIds, Math.min(newScore / 100, 1.0));
      }
    }
  } catch (err) {
    console.error('[Detector] Evaluation failed:', err.message);
  }
}

module.exports = { evaluateEvent };
