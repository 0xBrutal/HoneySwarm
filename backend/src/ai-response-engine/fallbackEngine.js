function terminalFallback(command) {
  const cmd = ((command || '').trim().split(/\s+/)[0] || '').toLowerCase();
  let response;

  if (['nmap', 'masscan', 'netcat', 'ncat'].includes(cmd)) {
    response = `${cmd}: (simulated) network scanning tools are blocked by host policy`;
  } else if (['python', 'python3', 'perl', 'ruby', 'node'].includes(cmd)) {
    response = `${cmd}: interactive interpreters are disabled on this host`;
  } else if (cmd === 'grep') {
    response = 'grep: missing pattern (usage: grep <pattern> <file>)';
  } else if (cmd === 'chmod' || cmd === 'chown') {
    response = `${cmd}: operation not permitted: read-only file system`;
  } else if (cmd === 'ifconfig' || cmd === 'ip') {
    response = 'vd-corp-01: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 10.20.4.15  netmask 255.255.255.0  broadcast 10.20.4.255';
  } else if (cmd === 'reboot' || cmd === 'shutdown') {
    response = `${cmd}: System has not been booted with systemd as init system. Operation refused.`;
  } else {
    response = `bash: ${cmd}: command not found`;
  }

  return {
    response,
    eventType: 'terminal_unknown_command',
    stateChanges: [],
    confidence: 1.0,
    reasoning: 'Deterministic fallback: AI providers unavailable or bypassed for this command.',
  };
}

function chatFallback(message) {
  const lower = (message || '').toLowerCase();
  let response;

  if (lower.includes('password') || lower.includes('credential') || lower.includes('login')) {
    response = 'For security reasons, HR cannot provide or reset passwords. Please contact IT Support at extension 4402.';
  } else if (lower.includes('salary') || lower.includes('pay')) {
    response = 'Compensation questions are handled through your direct manager and the annual review cycle. Would you like the policy document?';
  } else if (lower.includes('admin') || lower.includes('access')) {
    response = 'Access requests must be submitted through the IT ticketing portal. HR does not grant system permissions directly.';
  } else {
    const canned = [
      'Thank you for reaching out! Our HR team is available Monday to Friday, 9:00-17:00. Could you share more detail?',
      'I can help with onboarding, benefits, and company policy questions. What would you like to know?',
      'Let me check that for you. In the meantime, most internal resources are available in the Cloud Drive under Shared.',
    ];
    response = canned[Math.floor(Math.random() * canned.length)];
  }

  return {
    response,
    eventType: 'ai_interaction',
    stateChanges: [],
    confidence: 1.0,
    reasoning: 'Deterministic fallback reply.',
  };
}

module.exports = { terminalFallback, chatFallback };
