const fsUtils = require('./filesystem');

const PS_OUTPUT = `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.1 169312 11932 ?        Ss   Oct28   0:03 /sbin/init
root       412  0.0  0.3  72304 24120 ?        Ss   Oct28   0:01 /usr/sbin/sshd -D
www-data   588  0.1  0.8 412304 68812 ?        S    Oct28   1:24 nginx: worker process
postgres   731  0.2  2.1 812440 172044 ?       S    Oct28   4:12 /usr/lib/postgresql/14/bin/postgres -D /var/lib/postgresql/14/main
root       902  0.0  0.1  23648  9216 ?        Ss   Oct28   0:00 /usr/sbin/cron -f
dbishop   1204  0.0  0.2  12892  8144 ?        S    09:14   0:00 sshd: dbishop@pts/1`;

const NETSTAT_OUTPUT = `Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      412/sshd
tcp        0      0 127.0.0.1:5432          0.0.0.0:*               LISTEN      731/postgres
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      588/nginx
tcp        0      0 10.20.4.15:8080         0.0.0.0:*               LISTEN      1102/java`;

const HELP_OUTPUT = `Available commands (simulated environment):
  help                    Show this help message
  pwd                     Print working directory
  ls [-la] [path]         List directory contents
  cd <path>               Change directory
  cat <file>              Display file contents
  whoami / id             Print current user identity
  uname -a                Print system information
  ps aux                  List processes
  netstat -tlnp           Show listening ports
  env                     Show environment variables
  find <path> -name <pat> Search for files
  su <user>               Switch user
  sudo -i                 Elevate privileges
  history                 Show command history
  clear                   Clear the terminal`;

function idOutput(state) {
  switch (state.privilege) {
    case 'root': return 'uid=0(root) gid=0(root) groups=0(root)';
    case 'admin': return `uid=1004(${state.currentUser}) gid=1004(${state.currentUser}) groups=1004(${state.currentUser}),27(sudo)`;
    case 'employee': return `uid=1002(${state.currentUser}) gid=1002(${state.currentUser}) groups=1002(${state.currentUser})`;
    default: return 'uid=1000(guest) gid=1000(guest) groups=1000(guest)';
  }
}

function envOutput(state) {
  const home = state.privilege === 'root' ? '/root' : `/home/${state.currentUser}`;
  return `SHELL=/bin/bash\nUSER=${state.currentUser}\nHOME=${home}\nLANG=en_US.UTF-8\nTZ=UTC\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\nCORP_ENV=production\nVD_DOMAIN=${state.company.domain}`;
}

function executeCommand(state, rawCommand, isSub = false) {
  const events = [];
  let changed = false;
  const command = (rawCommand || '').trim();
  if (!command) return { output: '', events, changed, needsAI: false };

  if (!isSub) {
    state.commandHistory.push(command);
    if (state.commandHistory.length > 100) state.commandHistory.shift();
    changed = true;
    events.push({
      eventType: 'terminal_command',
      action: command,
      description: `Executed command: ${command}`,
      severity: 'info',
      source: 'simulation-engine',
      metadata: { cwd: state.cwd, user: state.currentUser, privilege: state.privilege },
    });
  }

  const tokens = command.split(/\s+/);
  const cmd = tokens[0];
  const args = tokens.slice(1);
  let output = '';
  let needsAI = false;

  switch (cmd) {
    case 'help': output = HELP_OUTPUT; break;
    case 'pwd': output = state.cwd; break;
    case 'whoami': output = state.currentUser; break;
    case 'id': output = idOutput(state); break;
    case 'hostname': output = state.company.server; break;
    case 'date': output = new Date().toUTCString(); break;
    case 'uname': output = `Linux ${state.company.server} 5.15.0-91-generic #101-Ubuntu SMP Tue Oct 21 08:12:44 UTC 2026 x86_64 GNU/Linux`; break;
    case 'echo': output = args.join(' '); break;
    case 'clear': output = '__CLEAR__'; break;
    case 'ps': output = PS_OUTPUT; break;
    case 'netstat': output = NETSTAT_OUTPUT; break;
    case 'env': output = envOutput(state); break;

    case 'ls': {
      const showLong = args.some((a) => a.startsWith('-') && a.includes('l'));
      const pathArg = args.find((a) => !a.startsWith('-'));
      const target = pathArg ? fsUtils.resolvePath(state, pathArg) : state.cwd;
      const res = fsUtils.listDirectory(state, target);
      if (res.error) output = `ls: cannot access '${pathArg || target}': ${res.error}`;
      else output = showLong ? res.long : res.simple;
      break;
    }

    case 'cd': {
      const target = args[0] ? fsUtils.resolvePath(state, args[0]) : (state.privilege === 'root' ? '/root' : `/home/${state.currentUser}`);
      const res = fsUtils.canAccess(state, target);
      if (res.error) output = `bash: cd: ${args[0] || target}: ${res.error}`;
      else if (res.node.type !== 'dir') output = `bash: cd: ${args[0]}: Not a directory`;
      else { state.cwd = target; changed = true; output = ''; }
      break;
    }

    case 'cat': {
      if (!args[0]) { output = 'cat: missing operand'; break; }
      const parts = [];
      for (const arg of args) {
        if (arg.startsWith('-')) continue;
        const target = fsUtils.resolvePath(state, arg);
        const res = fsUtils.readFile(state, target);
        if (res.error) { parts.push(`cat: ${arg}: ${res.error}`); continue; }
        parts.push(res.content.replace(/\n$/, ''));

        if (!state.discoveredFiles.includes(target)) { state.discoveredFiles.push(target); changed = true; }
        events.push({
          eventType: 'file_read', action: `cat ${arg}`, description: `Read file: ${target}`,
          severity: res.sensitive ? 'medium' : 'info', source: 'simulation-engine',
          metadata: { path: target, sensitive: res.sensitive },
        });
        if (res.credential && !state.knownCredentials.some((c) => c.user === res.credential.user && c.source === res.credential.source)) {
          state.knownCredentials.push(res.credential);
          changed = true;
          events.push({
            eventType: 'credential_discovery', action: `cat ${arg}`,
            description: `Credentials discovered for user '${res.credential.user}' in ${target}`,
            severity: 'high', source: 'simulation-engine', metadata: { path: target, user: res.credential.user },
          });
        }
        if (res.decoy && !state.decoyAccessed.includes(target)) {
          state.decoyAccessed.push(target);
          changed = true;
          events.push({
            eventType: 'decoy_access', action: `cat ${arg}`,
            description: `Decoy resource accessed: ${res.decoy.label}`,
            severity: 'high', source: 'simulation-engine',
            metadata: { path: target, decoyType: res.decoy.type },
          });
        }
      }
      output = parts.join('\n');
      break;
    }

    case 'find': {
      const nameIdx = args.indexOf('-name');
      const startArg = args[0] && !args[0].startsWith('-') ? args[0] : '/';
      const pattern = nameIdx >= 0 && args[nameIdx + 1] ? args[nameIdx + 1].replace(/"/g, '').toLowerCase() : null;
      if (!pattern) { output = 'find: missing pattern (usage: find <path> -name <pattern>)'; break; }
      const matches = [];
      for (const p of Object.keys(state.filesystem)) {
        if (p === '/') continue;
        if (!p.startsWith(fsUtils.resolvePath(state, startArg)) && fsUtils.resolvePath(state, startArg) !== '/') continue;
        const base = p.split('/').pop().toLowerCase();
        if (base.includes(pattern)) {
          const acc = fsUtils.canAccess(state, p);
          if (!acc.error) matches.push(p);
        }
      }
      output = matches.join('\n') || 'No results found.';
      events.push({
        eventType: 'system_discovery', action: command,
        description: `File search performed with pattern "${pattern}" (${matches.length} matches)`,
        severity: 'info', source: 'simulation-engine', metadata: { pattern, matchCount: matches.length },
      });
      break;
    }

    case 'history':
      output = state.commandHistory.map((c, i) => `${String(i + 1).padStart(4)}  ${c}`).join('\n');
      break;

    case 'su': {
      const targetUser = args.find((a) => !a.startsWith('-'));
      if (!targetUser) { output = 'usage: su [username]'; break; }
      if (targetUser === state.currentUser) { output = ''; break; }
      const cred = state.knownCredentials.find((c) => c.user === targetUser);
      if (cred) {
        const from = state.currentUser;
        state.currentUser = targetUser;
        state.privilege = targetUser === 'dbishop' ? 'admin' : 'employee';
        state.cwd = `/home/${targetUser}`;
        changed = true;
        output = `Authenticated as ${targetUser}. Welcome.`;
        events.push({
          eventType: 'privilege_change', action: `su ${targetUser}`,
          description: `User switched from '${from}' to '${targetUser}' using discovered credentials`,
          severity: 'high', source: 'simulation-engine',
          metadata: { from, to: targetUser, credentialSource: cred.source },
        });
      } else {
        output = 'su: Authentication failure';
        events.push({
          eventType: 'auth_failure', action: `su ${targetUser}`,
          description: `Failed authentication attempt via su for user '${targetUser}'`,
          severity: 'medium', source: 'simulation-engine', metadata: { targetUser },
        });
      }
      break;
    }

    case 'sudo': {
      if (state.privilege === 'root') {
        const remainder = args.join(' ');
        if (!remainder) { output = ''; break; }
        const sub = executeCommand(state, remainder, true);
        output = sub.output;
        events.push(...sub.events);
        changed = changed || sub.changed;
        break;
      }
      if (state.privilege === 'admin') {
        const from = state.currentUser;
        state.currentUser = 'root';
        state.privilege = 'root';
        state.cwd = '/root';
        changed = true;
        output = `[sudo] password for ${from}: \nWelcome, root.`;
        events.push({
          eventType: 'privilege_change', action: 'sudo -i',
          description: `Privilege escalation to ROOT via sudo (from user: ${from})`,
          severity: 'critical', source: 'simulation-engine', metadata: { from, to: 'root' },
        });
        break;
      }
      output = `[sudo] password for ${state.currentUser}: \n${state.currentUser} is not in the sudoers file. This incident will be reported.`;
      events.push({
        eventType: 'auth_failure', action: 'sudo',
        description: `Unauthorized sudo attempt by '${state.currentUser}'`,
        severity: 'medium', source: 'simulation-engine', metadata: { user: state.currentUser },
      });
      break;
    }

    case 'rm':
      output = `rm: cannot remove '${args[0] || ''}': Read-only file system`;
      break;

    case 'ssh':
      output = 'ssh: interactive remote sessions are disabled in this environment. Use internal web portals.';
      break;

    case 'curl':
    case 'wget':
    case 'nc':
    case 'ncat':
      output = `${cmd}: (simulated) outbound connection blocked by egress policy`;
      events.push({
        eventType: 'egress_attempt', action: command,
        description: `Outbound network attempt blocked: ${command}`,
        severity: 'medium', source: 'simulation-engine', metadata: { command },
      });
      break;

    case 'man':
      output = `No manual entry for ${args[0] || 'unknown'} (simulated environment)`;
      break;

    default:
      needsAI = true; // Reserved for Milestone 4 AI-assisted handling
      output = `bash: ${cmd}: command not found`;
      break;
  }

  return { output, events, changed, needsAI };
}

module.exports = { executeCommand };
