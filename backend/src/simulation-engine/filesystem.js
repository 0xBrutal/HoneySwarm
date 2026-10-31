function resolvePath(state, input) {
  if (!input) return state.cwd;
  let p = input;
  const home = state.privilege === 'root' ? '/root' : `/home/${state.currentUser}`;
  if (p === '~') p = home;
  else if (p.startsWith('~/')) p = home + p.slice(1);
  if (!p.startsWith('/')) p = state.cwd === '/' ? `/${p}` : `${state.cwd}/${p}`;
  const parts = p.split('/').filter(Boolean);
  const stack = [];
  for (const part of parts) {
    if (part === '.') continue;
    else if (part === '..') stack.pop();
    else stack.push(part);
  }
  return '/' + stack.join('/');
}

function canAccess(state, path) {
  const node = state.filesystem[path];
  if (!node) return { error: 'No such file or directory' };
  if (state.privilege === 'root') return { node };
  if (node.restrictedTo && node.restrictedTo !== state.currentUser) {
    return { error: 'Permission denied' };
  }
  return { node };
}

function listDirectory(state, path) {
  const access = canAccess(state, path);
  if (access.error) return { error: access.error };
  const node = access.node;
  if (node.type !== 'dir') return { error: 'Not a directory' };

  const entries = (node.children || []).map((name) => {
    const childPath = path === '/' ? `/${name}` : `${path}/${name}`;
    const child = state.filesystem[childPath];
    const childAccess = child ? canAccess(state, childPath) : { error: 'missing' };
    return {
      name,
      path: childPath,
      type: child ? child.type : 'unknown',
      permissions: child ? child.permissions : '----------',
      owner: child ? child.owner : 'root',
      restricted: childAccess.error === 'Permission denied',
    };
  });

  const simple = entries.map((e) => e.name + (e.type === 'dir' ? '/' : '')).join('  ');
  const long = entries
    .map((e) => `${e.permissions}  ${e.owner.padEnd(9)} ${String(e.type === 'dir' ? 4096 : 1024).padStart(6)}  ${e.name}${e.type === 'dir' ? '/' : ''}`)
    .join('\n');

  return { path, entries, simple, long };
}

function readFile(state, path) {
  const access = canAccess(state, path);
  if (access.error) return { error: access.error };
  const node = access.node;
  if (node.type !== 'file') return { error: 'Is a directory' };
  return {
    content: node.content || '',
    credential: node.credential || null,
    decoy: node.decoy || null,
    sensitive: !!node.sensitive,
  };
}

module.exports = { resolvePath, canAccess, listDirectory, readFile };
