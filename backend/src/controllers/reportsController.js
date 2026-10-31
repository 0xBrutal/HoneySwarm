const PDFDocument = require('pdfkit');
const { mapEventToMitre } = require('../threat-classifier/mitreMapper');

function buildReportData(db, sessionId) {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!session) return null;

  const intel = db.prepare('SELECT * FROM threat_intelligence WHERE session_id = ?').get(sessionId);
  const events = db.prepare('SELECT * FROM events WHERE session_id = ? ORDER BY timestamp ASC').all(sessionId);

  const mitreMap = {};
  for (const ev of events) {
    const techniques = mapEventToMitre({
      id: ev.id, eventType: ev.event_type, action: ev.action || '', metadata: JSON.parse(ev.metadata || '{}'),
    });
    for (const t of techniques) {
      if (!mitreMap[t.id]) mitreMap[t.id] = { ...t, evidence: [], confidence: 0.9 };
      mitreMap[t.id].evidence.push(ev.id);
    }
  }

  return {
    session,
    intelligence: intel,
    events,
    mitreTechniques: Object.values(mitreMap),
  };
}

function exportJSON(req, res) {
  const db = req.app.get('db');
  const data = buildReportData(db, req.params.sessionId);
  if (!data) return res.status(404).json({ message: 'Session not found' });

  res.setHeader('Content-Disposition', `attachment; filename=honeyswarm_report_${req.params.sessionId.slice(0, 8)}.json`);
  res.setHeader('Content-Type', 'application/json');
  res.json(data);
}

function exportPDF(req, res) {
  const db = req.app.get('db');
  const data = buildReportData(db, req.params.sessionId);
  if (!data) return res.status(404).json({ message: 'Session not found' });

  const doc = new PDFDocument({ margin: 50 });
  const filename = `honeyswarm_report_${req.params.sessionId.slice(0, 8)}.pdf`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);

  // --- PDF Content ---
  doc.fontSize(24).text('HoneySwarm Incident Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Session ID: ${data.session.id}`, { align: 'center' });
  doc.text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
  doc.moveDown(2);

  // Executive Summary
  doc.fontSize(18).text('Executive Summary', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`Final Threat Score: ${data.session.threat_score} / 100`);
  doc.text(`Routing Stage: ${data.session.routing_stage.toUpperCase()}`);
  doc.text(`Status: ${data.session.status}`);
  doc.text(`Started: ${new Date(data.session.started_at + 'Z').toUTCString()}`);
  doc.text(`Ended: ${data.session.ended_at ? new Date(data.session.ended_at + 'Z').toUTCString() : 'Active'}`);
  doc.moveDown();

  if (data.intelligence) {
    doc.text(`Estimated Objective: ${data.intelligence.objective_estimate}`);
    doc.text(`Estimated Skill Level: ${data.intelligence.skill_estimate}`);
    doc.moveDown();
  }

  // MITRE ATT&CK Mapping
  doc.fontSize(18).text('MITRE ATT&CK Mapping', { underline: true });
  doc.moveDown(0.5);
  if (data.mitreTechniques.length === 0) {
    doc.fontSize(12).text('No techniques mapped.');
  } else {
    data.mitreTechniques.forEach(tech => {
      doc.fontSize(12).text(`${tech.id}: ${tech.name}`, { bold: true });
      doc.text(`Tactic: ${tech.tactic} | Evidence: ${tech.evidence.length} event(s)`);
      doc.moveDown(0.5);
    });
  }
  doc.moveDown();

  // Event Timeline
  doc.addPage();
  doc.fontSize(18).text('Event Timeline', { underline: true });
  doc.moveDown(0.5);

  doc.fontSize(10);
  data.events.forEach(ev => {
    const time = new Date(ev.timestamp + 'Z').toUTCString().split(' ')[4]; // HH:MM:SS
    const severity = ev.severity.toUpperCase().padEnd(8);
    doc.text(`[${time}] [${severity}] ${ev.event_type}`);
    doc.text(`  Action: ${ev.action || 'N/A'}`, { indent: 20 });
    if (ev.description) doc.text(`  Desc: ${ev.description}`, { indent: 20 });
    doc.moveDown(0.2);
  });

  doc.end();
}

module.exports = { exportJSON, exportPDF };