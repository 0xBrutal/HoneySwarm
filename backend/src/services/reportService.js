const PDFDocument = require('pdfkit');
const { mapEventToMitre } = require('../threat-classifier/mitreMapper');

function collectReportData(db, sessionId) {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!session) return null;

  const intel = db.prepare('SELECT * FROM threat_intelligence WHERE session_id = ?').get(sessionId);
  const events = db.prepare('SELECT * FROM events WHERE session_id = ? ORDER BY timestamp ASC').all(sessionId);
  const stateRow = db.prepare('SELECT state_json FROM simulation_state WHERE session_id = ?').get(sessionId);
  const state = stateRow ? JSON.parse(stateRow.state_json) : {};

  const mitreMap = {};
  for (const ev of events) {
    const techniques = mapEventToMitre({
      id: ev.id,
      eventType: ev.event_type,
      action: ev.action || '',
      metadata: JSON.parse(ev.metadata || '{}'),
    });
    for (const t of techniques) {
      if (!mitreMap[t.id]) mitreMap[t.id] = { ...t, evidence: [] };
      mitreMap[t.id].evidence.push(ev.id);
    }
  }

  return { session, intel, events, state, mitre: Object.values(mitreMap) };
}

function buildJsonReport(data) {
  const { session, intel, events, state, mitre } = data;
  return {
    reportVersion: '1.0',
    generatedAt: new Date().toISOString(),
    classification: 'FICTIONAL DEMONSTRATION DATA',
    session: {
      id: session.id,
      visitorId: session.visitor_id,
      sessionType: session.session_type,
      routingStage: session.routing_stage,
      threatScore: session.threat_score,
      status: session.status,
      startedAt: session.started_at,
      lastActivityAt: session.last_activity_at,
    },
    behavioralAnalysis: intel ? {
      objectiveEstimate: intel.objective_estimate,
      skillEstimate: intel.skill_estimate,
      confidence: intel.confidence,
      basis: 'Deterministic rule-based estimation from observed evidence',
    } : null,
    mitreTechniques: mitre.map((t) => ({ id: t.id, name: t.name, tactic: t.tactic, evidenceEventIds: t.evidence })),
    deceptionEngagement: {
      decoysAccessed: state.decoyAccessed || [],
      credentialsDiscovered: (state.knownCredentials || []).map((c) => ({ user: c.user, source: c.source, password: '[REDACTED]' })),
      discoveredFilesCount: (state.discoveredFiles || []).length,
    },
    eventTimeline: events.map((ev) => ({
      id: ev.id, timestamp: ev.timestamp, eventType: ev.event_type, severity: ev.severity,
      source: ev.source, action: ev.action, description: ev.description,
    })),
    disclaimer: 'All data in this report originates from a simulated, fictional environment. No real systems were accessed and no real user data was collected.',
  };
}

function buildCsv(data) {
  const esc = (v) => {
    const s = String(v === null || v === undefined ? '' : v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [['id', 'timestamp', 'event_type', 'severity', 'source', 'action', 'description']];
  for (const ev of data.events) {
    rows.push([ev.id, ev.timestamp, ev.event_type, ev.severity, ev.source, ev.action, ev.description]);
  }
  return rows.map((r) => r.map(esc).join(',')).join('\n');
}

function section(doc, title) {
  doc.moveDown(1.2).font('Helvetica-Bold').fontSize(13).fillColor('#0f172a').text(title);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#0e7490').lineWidth(1).stroke();
  doc.moveDown(0.6).fill('#111827');
}

function meta(doc, label, value) {
  doc.font('Helvetica-Bold').fontSize(9).fill('#374151').text(`${label}: `, { continued: true });
  doc.font('Helvetica').fill('#111827').text(String(value));
  doc.moveDown(0.15);
}

function streamPdf(res, data) {
  const { session, intel, events, state, mitre } = data;
  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="honeyswarm-report-${session.id.slice(0, 8)}.pdf"`);
  doc.pipe(res);

  const GRAY = '#6b7280';

  // Header band
  doc.rect(0, 0, doc.page.width, 95).fill('#0f172a');
  doc.fill('#ffffff').font('Helvetica-Bold').fontSize(22).text('HoneySwarm Incident Report', 50, 30);
  doc.fill('#67e8f9').font('Helvetica-Oblique').fontSize(10).text('Let Them In. Learn Everything.', 50, 60);

  doc.fill('#111827').moveDown(4.5);
  meta(doc, 'Generated', new Date().toISOString());
  meta(doc, 'Classification', 'FICTIONAL DEMONSTRATION DATA');

  section(doc, '1. Session Overview');
  meta(doc, 'Session ID', session.id);
  meta(doc, 'Visitor ID', session.visitor_id);
  meta(doc, 'Session Type', session.session_type);
  meta(doc, 'Routing Stage', session.routing_stage.toUpperCase());
  meta(doc, 'Threat Score', `${session.threat_score} / 100`);
  meta(doc, 'Status', session.status);
  meta(doc, 'Started At', session.started_at);
  meta(doc, 'Last Activity', session.last_activity_at);

  section(doc, '2. Behavioral Analysis (ESTIMATED)');
  if (intel) {
    meta(doc, 'Estimated Objective', intel.objective_estimate || 'Unknown');
    meta(doc, 'Estimated Skill Level', intel.skill_estimate || 'Unknown');
    meta(doc, 'Confidence', `${Math.round((intel.confidence || 0) * 100)}%`);
    doc.font('Helvetica-Oblique').fontSize(8).fillColor(GRAY)
      .text('These values are deterministic estimates derived from observed evidence. They are not confirmed facts.');
    doc.fill('#111827');
  } else {
    doc.fontSize(9).text('Insufficient evidence recorded for behavioral estimation.');
  }

  section(doc, '3. MITRE ATT&CK Mapping (OBSERVED)');
  if (mitre.length === 0) {
    doc.fontSize(9).text('No techniques mapped to observed evidence.');
  } else {
    for (const t of mitre) {
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#0e7490').text(`${t.id} — ${t.name}`);
      doc.font('Helvetica').fontSize(8).fill('#374151')
        .text(`Tactic: ${t.tactic}   |   Supporting event IDs: ${t.evidence.join(', ')}`);
      doc.moveDown(0.4);
    }
    doc.fill('#111827');
  }

  section(doc, '4. Deception Engagement (OBSERVED)');
  const decoys = state.decoyAccessed || [];
  meta(doc, 'Decoys Triggered', decoys.length ? decoys.join(', ') : 'None');
  const creds = (state.knownCredentials || []).map((c) => `${c.user} (source: ${c.source})`).join(', ');
  meta(doc, 'Credentials Harvested', creds || 'None');
  meta(doc, 'Files Discovered', String((state.discoveredFiles || []).length));

  section(doc, '5. Event Timeline');
  if (events.length === 0) {
    doc.fontSize(9).text('No events recorded.');
  }
  for (const ev of events) {
    const sev = (ev.severity || 'info').toUpperCase();
    const sevColor = ev.severity === 'critical' ? '#b91c1c' : ev.severity === 'high' ? '#c2410c' : ev.severity === 'medium' ? '#b45309' : '#374151';
    doc.font('Helvetica-Bold').fontSize(8).fillColor(sevColor).text(`[${sev}]`, { continued: true });
    doc.font('Helvetica').fill('#111827').text(` ${ev.timestamp} — ${ev.event_type}: ${ev.action || 'n/a'}`);
    doc.moveDown(0.2);
  }

  section(doc, '6. Disclaimer');
  doc.font('Helvetica').fontSize(8).fill(GRAY).text(
    'This report was generated by HoneySwarm, an adaptive cyber deception demonstration platform. All sessions, users, files, credentials and events described above are fictional and were produced by an isolated simulation engine. No real systems were accessed and no real user data was collected.'
  );

  // Page footers
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const oldBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.font('Helvetica').fontSize(8).fill('#9ca3af')
      .text(`HoneySwarm — Fictional demonstration data — Page ${i + 1} of ${range.count}`,
        50, doc.page.height - 35, { align: 'center', width: doc.page.width - 100 });
    doc.page.margins.bottom = oldBottom;
  }

  doc.end();
}

module.exports = { collectReportData, buildJsonReport, buildCsv, streamPdf };
