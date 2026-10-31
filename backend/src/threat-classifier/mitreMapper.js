const MITRE_TECHNIQUES = {
  T1087_001: { id: 'T1087.001', name: 'Account Discovery: Local Account', tactic: 'Discovery' },
  T1082: { id: 'T1082', name: 'System Information Discovery', tactic: 'Discovery' },
  T1083: { id: 'T1083', name: 'File and Directory Discovery', tactic: 'Discovery' },
  T1057: { id: 'T1057', name: 'Process Discovery', tactic: 'Discovery' },
  T1016: { id: 'T1016', name: 'System Network Configuration Discovery', tactic: 'Discovery' },
  T1552_001: { id: 'T1552.001', name: 'Unsecured Credentials: Credentials In Files', tactic: 'Credential Access' },
  T1552_004: { id: 'T1552.004', name: 'Unsecured Credentials: Private Keys', tactic: 'Credential Access' },
  T1078_003: { id: 'T1078.003', name: 'Valid Accounts: Local Accounts', tactic: 'Privilege Escalation' },
  T1548_003: { id: 'T1548.003', name: 'Abuse Elevation Control Mechanism: Sudo', tactic: 'Privilege Escalation' },
};

function mapEventToMitre(event) {
  const techniques = [];
  const action = (event.action || '').toLowerCase();
  const meta = event.metadata || {};

  if (event.eventType === 'terminal_command') {
    if (action.startsWith('whoami') || action.startsWith('id') || action.includes('cat /etc/passwd')) {
      techniques.push({ ...MITRE_TECHNIQUES.T1087_001, evidence: [event.id || 'pending'] });
    }
    if (action.startsWith('uname') || action.startsWith('hostname') || action.startsWith('env')) {
      techniques.push({ ...MITRE_TECHNIQUES.T1082, evidence: [event.id || 'pending'] });
    }
    if (action.startsWith('ls') || action.startsWith('find')) {
      techniques.push({ ...MITRE_TECHNIQUES.T1083, evidence: [event.id || 'pending'] });
    }
    if (action.startsWith('ps')) {
      techniques.push({ ...MITRE_TECHNIQUES.T1057, evidence: [event.id || 'pending'] });
    }
    if (action.startsWith('netstat')) {
      techniques.push({ ...MITRE_TECHNIQUES.T1016, evidence: [event.id || 'pending'] });
    }
  }

  if (event.eventType === 'credential_discovery') {
    if (meta.path && (meta.path.includes('id_rsa') || meta.path.includes('.ssh'))) {
      techniques.push({ ...MITRE_TECHNIQUES.T1552_004, evidence: [event.id || 'pending'] });
    } else {
      techniques.push({ ...MITRE_TECHNIQUES.T1552_001, evidence: [event.id || 'pending'] });
    }
  }

  if (event.eventType === 'privilege_change') {
    if (action.includes('sudo')) {
      techniques.push({ ...MITRE_TECHNIQUES.T1548_003, evidence: [event.id || 'pending'] });
    } else {
      techniques.push({ ...MITRE_TECHNIQUES.T1078_003, evidence: [event.id || 'pending'] });
    }
  }

  return techniques;
}

module.exports = { mapEventToMitre, MITRE_TECHNIQUES };
