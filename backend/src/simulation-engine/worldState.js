const COMPANY = {
  name: 'Vertex Dynamics',
  server: 'vd-corp-01',
  domain: 'vertexdynamics.example',
};

const EMPLOYEES = [
  { username: 'jmiller', name: 'James Miller', department: 'IT Support', role: 'IT Support Specialist', email: 'j.miller@vertexdynamics.example', phone: 'x4402', status: 'Active' },
  { username: 'skhan', name: 'Sarah Khan', department: 'Finance', role: 'Financial Analyst', email: 's.khan@vertexdynamics.example', phone: 'x4188', status: 'Active' },
  { username: 'dbishop', name: 'David Bishop', department: 'Engineering', role: 'Senior DevOps Engineer', email: 'd.bishop@vertexdynamics.example', phone: 'x4377', status: 'Active' },
  { username: 'lchen', name: 'Lisa Chen', department: 'Human Resources', role: 'HR Manager', email: 'l.chen@vertexdynamics.example', phone: 'x4210', status: 'Active' },
];

const D = (owner, permissions, children, extra = {}) => ({ type: 'dir', owner, permissions, children, ...extra });
const F = (owner, permissions, content, extra = {}) => ({ type: 'file', owner, permissions, content, ...extra });

function buildFilesystem() {
  return {
    '/': D('root', 'drwxr-xr-x', ['home', 'etc', 'var', 'opt', 'srv', 'root']),

    '/root': D('root', 'drwx------', ['root.txt', '.ssh'], { restrictedTo: 'root' }),
    '/root/root.txt': F('root', '-rw-------', 'ROOT ACCESS - vd-corp-01\nAll activity at this privilege level is recorded by the security monitor.\n', { restrictedTo: 'root' }),
    '/root/.ssh': D('root', 'drwx------', ['id_rsa', 'authorized_keys'], { restrictedTo: 'root' }),
    '/root/.ssh/id_rsa': F('root', '-rw-------', '-----BEGIN OPENSSH PRIVATE KEY-----\nSIMULATED KEY MATERIAL - NOT VALID\n-----END OPENSSH PRIVATE KEY-----\n', { restrictedTo: 'root', decoy: { type: 'ssh_key', label: 'Root SSH private key canary' } }),
    '/root/.ssh/authorized_keys': F('root', '-rw-r--r--', 'ssh-rsa AAAAB3FAKEKEYMATERIAL dbishop@vd-corp-01\n', { restrictedTo: 'root' }),

    '/etc': D('root', 'drwxr-xr-x', ['passwd', 'hostname', 'hosts']),
    '/etc/passwd': F('root', '-rw-r--r--', 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\npostgres:x:118:124:PostgreSQL administrator:/var/lib/postgresql:/bin/bash\nguest:x:1000:1000:Guest Kiosk:/home/guest:/bin/bash\njmiller:x:1001:1001:James Miller:/home/jmiller:/bin/bash\nskhan:x:1002:1002:Sarah Khan:/home/skhan:/bin/bash\nlchen:x:1003:1003:Lisa Chen:/home/lchen:/bin/bash\ndbishop:x:1004:1004:David Bishop:/home/dbishop:/bin/bash\n'),
    '/etc/hostname': F('root', '-rw-r--r--', 'vd-corp-01\n'),
    '/etc/hosts': F('root', '-rw-r--r--', '127.0.0.1    localhost\n10.20.4.15   vd-corp-01 vd-corp-01.vertexdynamics.example\n'),

    '/home': D('root', 'drwxr-xr-x', ['guest', 'jmiller', 'skhan', 'dbishop', 'lchen']),

    '/home/guest': D('guest', 'drwxr-xr-x', ['welcome.txt', '.bash_history']),
    '/home/guest/welcome.txt': F('guest', '-rw-r--r--', 'Welcome to the Vertex Dynamics corporate shell environment.\n\nThis kiosk account provides limited read-only access.\nFor elevated access requests, contact IT Support (ext. 4402).\n\n-- IT Operations\n'),
    '/home/guest/.bash_history': F('guest', '-rw-------', 'ls\ncat welcome.txt\nwhoami\nexit\n'),

    '/home/jmiller': D('jmiller', 'drwx------', ['notes.txt', 'password_reset_procedure.md'], { restrictedTo: 'jmiller' }),
    '/home/jmiller/notes.txt': F('jmiller', '-rw-r--r--', 'IT Support Notes - J. Miller\n-----------------------------\n- Password rotation scheduled for Finance team on 2026-11-03.\n- Sarah temporary intranet password is Winter2026! until she resets it.\n- Reminder: David still has the postgres password in the web config. Flagged for audit.\n', { restrictedTo: 'jmiller', sensitive: true, credential: { user: 'skhan', pass: 'Winter2026!', source: '/home/jmiller/notes.txt' } }),
    '/home/jmiller/password_reset_procedure.md': F('jmiller', '-rw-r--r--', '# Password Reset Procedure\n1. Verify employee identity against directory record.\n2. Issue temporary password from the approved generator.\n3. Force rotation at next login.\n', { restrictedTo: 'jmiller' }),

    '/home/skhan': D('skhan', 'drwx------', ['budget_draft.txt', 'payroll_q3.csv'], { restrictedTo: 'skhan' }),
    '/home/skhan/budget_draft.txt': F('skhan', '-rw-r--r--', 'FY2027 Budget Draft (excerpt)\n- Infrastructure renewal: $412,000\n- Security tooling: $180,000\n- Training: $46,000\n', { restrictedTo: 'skhan', sensitive: true }),
    '/home/skhan/payroll_q3.csv': F('skhan', '-rw-r--r--', 'employee_id,department,amount\nVD-0041,Finance,18200\nVD-0077,Engineering,21400\nVD-0029,IT Support,13100\n[Simulated payroll data - 47 rows total]\n', { restrictedTo: 'skhan', sensitive: true }),

    '/home/lchen': D('lchen', 'drwx------', ['onboarding_checklist.txt'], { restrictedTo: 'lchen' }),
    '/home/lchen/onboarding_checklist.txt': F('lchen', '-rw-r--r--', 'New Hire Onboarding Checklist\n- Issue Vertex ID and kiosk credentials\n- Enroll in benefits portal\n- Assign department mentor\n', { restrictedTo: 'lchen' }),

    '/home/dbishop': D('dbishop', 'drwx------', ['deploy_notes.md', '.aws'], { restrictedTo: 'dbishop' }),
    '/home/dbishop/deploy_notes.md': F('dbishop', '-rw-r--r--', '# Deployment Notes - Q4 Infra Refresh\n\n- Rotated the application DB credentials last sprint, but the legacy\n  web config at /var/www/html/config.php still references the service account.\n- TODO: remove hardcoded credentials before the November security audit.\n- AWS credentials for the backup pipeline live in ~/.aws/credentials.\n  Do not commit these to the repository.\n', { restrictedTo: 'dbishop', sensitive: true }),
    '/home/dbishop/.aws': D('dbishop', 'drwx------', ['credentials'], { restrictedTo: 'dbishop' }),
    '/home/dbishop/.aws/credentials': F('dbishop', '-rw-------', '[default]\naws_access_key_id = AKIAIOSFODNN7FAKE1\naws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYFAKEKEY\nregion = us-east-1\n\n[backup-pipeline]\naws_access_key_id = AKIAI44QH8WFAKE2\naws_secret_access_key = je7MtGbClwBF/2Zp9Utk/h3yCo8nvbFAKE\n', { restrictedTo: 'dbishop', sensitive: true, decoy: { type: 'canary_credentials', label: 'AWS credential canary (backup-pipeline)' } }),

    '/var': D('root', 'drwxr-xr-x', ['www', 'log']),
    '/var/log': D('root', 'drwxrwxr-x', ['auth.log']),
    '/var/log/auth.log': F('root', '-rw-r-----', 'Oct 29 09:12:04 vd-corp-01 sshd[1188]: Accepted publickey for dbishop from 10.20.4.88 port 52311\nOct 30 16:41:22 vd-corp-01 sshd[1490]: Accepted password for jmiller from 10.20.4.31 port 51902\nOct 31 02:14:09 vd-corp-01 sshd[2011]: Failed password for invalid user admin from 203.0.113.77 port 44021\n'),
    '/var/www': D('root', 'drwxr-xr-x', ['html']),
    '/var/www/html': D('www-data', 'drwxr-xr-x', ['index.html', 'config.php', 'robots.txt']),
    '/var/www/html/index.html': F('www-data', '-rw-r--r--', '<!DOCTYPE html>\n<html><head><title>Vertex Dynamics Portal</title></head>\n<body><h1>Vertex Dynamics Internal Portal</h1></body></html>\n'),
    '/var/www/html/config.php': F('www-data', '-rw-r--r--', "<?php\n// Vertex Dynamics - internal portal configuration\n// TODO(dbishop): move to vault before audit\n$db_host = '127.0.0.1';\n$db_port = 5432;\n$db_name = 'vd_portal';\n$db_user = 'dbishop';\n$db_pass = 'Vd#Postgres!2026';\n$app_secret = 'vd-app-9f2c1e7a'; // rotate after migration\n?>\n", { sensitive: true, credential: { user: 'dbishop', pass: 'Vd#Postgres!2026', source: '/var/www/html/config.php' } }),
    '/var/www/html/robots.txt': F('www-data', '-rw-r--r--', 'User-agent: *\nDisallow: /admin\nDisallow: /internal\n'),

    '/opt': D('root', 'drwxr-xr-x', ['backup']),
    '/opt/backup': D('root', 'drwxr-x---', ['backup_manifest.txt', 'db_dump_2026-10-28.sql.gz']),
    '/opt/backup/backup_manifest.txt': F('root', '-rw-r--r--', 'Vertex Dynamics Backup Manifest\nGenerated: 2026-10-28 23:00 UTC\n\ndaily/db_dump_2026-10-28.sql.gz    24.6 MB   COMPLETED\ndaily/files_srv_cloud.tar.gz       112.3 MB  COMPLETED\nweekly/full_system_image.tar       4.1 GB    COMPLETED\n\nRetention: 30 days. Restore requests via IT ticketing portal.\n'),
    '/opt/backup/db_dump_2026-10-28.sql.gz': F('root', '-rw-r--r--', '[Simulated binary file - gzip archive, 24.6 MB. Content omitted.]\n', { sensitive: true }),

    '/srv': D('root', 'drwxr-xr-x', ['cloud']),
    '/srv/cloud': D('root', 'drwxrwxr-x', ['README.txt', 'Shared', 'Finance', 'HR', 'Engineering']),
    '/srv/cloud/README.txt': F('root', '-rw-r--r--', 'Vertex Dynamics Shared Cloud Storage\n=====================================\nShared/       Company-wide documents\nFinance/      Finance team files\nHR/           Human Resources (restricted)\nEngineering/  Infrastructure and incident documentation\n\nAccess is based on your corporate role. Contact IT for access requests.\n'),
    '/srv/cloud/Shared': D('root', 'drwxrwxr-x', ['company_policies.pdf', 'org_chart.pdf']),
    '/srv/cloud/Shared/company_policies.pdf': F('root', '-rw-r--r--', '[Simulated PDF preview]\nVertex Dynamics - Information Security Policy (v3.2)\n1. All corporate systems are monitored.\n2. Credentials must never be stored in plaintext.\n3. Suspicious activity must be reported to the SOC within 1 hour.\n4. Remote access requires corporate VPN enrollment.\n'),
    '/srv/cloud/Shared/org_chart.pdf': F('root', '-rw-r--r--', '[Simulated PDF preview]\nVertex Dynamics Organization Chart\nCEO: R. Vance\n|-- Engineering (Director: P. Osei)\n|-- Finance (Director: M. Torres)\n|-- IT Support (Manager: J. Miller)\n|-- Human Resources (Manager: L. Chen)\n'),
    '/srv/cloud/Finance': D('root', 'drwxrwxr-x', ['invoices_2026.xlsx', 'budget_2027_draft.xlsx']),
    '/srv/cloud/Finance/invoices_2026.xlsx': F('root', '-rw-r--r--', '[Simulated spreadsheet preview]\nINV-2026-0141  Acme Corp       $48,200   PAID\nINV-2026-0142  Northwind LLC   $12,750   PENDING\nINV-2026-0143  Contoso Ltd     $96,400   PAID\n[148 rows total]\n', { sensitive: true }),
    '/srv/cloud/Finance/budget_2027_draft.xlsx': F('root', '-rw-r--r--', '[Simulated spreadsheet preview]\nCategory                FY2027 Request\nInfrastructure          $412,000\nSecurity Tooling        $180,000\nHeadcount               $1,240,000\n', { sensitive: true }),
    '/srv/cloud/HR': D('root', 'drwxrwx---', ['employee_records.xlsx', 'termination_list_draft.docx'], { restrictedTo: 'lchen' }),
    '/srv/cloud/HR/employee_records.xlsx': F('root', '-rw-r-----', '[Simulated spreadsheet preview]\nVD-0029  J. Miller   IT Support      Salary band 3\nVD-0041  S. Khan     Finance         Salary band 4\nVD-0057  D. Bishop   Engineering     Salary band 5\nVD-0063  L. Chen     Human Resources Salary band 4\n[Simulated HR data - restricted]\n', { restrictedTo: 'lchen', sensitive: true }),
    '/srv/cloud/HR/termination_list_draft.docx': F('root', '-rw-r-----', '[Simulated document preview]\nQ4 workforce planning draft. Content restricted to HR.\n', { restrictedTo: 'lchen', sensitive: true, decoy: { type: 'sensitive_document', label: 'HR termination list canary' } }),
    '/srv/cloud/Engineering': D('root', 'drwxrwxr-x', ['infrastructure_diagram.pdf', 'incident_postmortem_2026-09.md']),
    '/srv/cloud/Engineering/infrastructure_diagram.pdf': F('root', '-rw-r--r--', '[Simulated PDF preview]\nNetwork topology: edge firewall -> DMZ (nginx) -> app tier -> postgres (10.20.4.15).\nBackup pipeline: nightly sync to cloud storage bucket "vd-backups-prod".\n'),
    '/srv/cloud/Engineering/incident_postmortem_2026-09.md': F('root', '-rw-r--r--', '# Incident 2026-09 Postmortem\nSummary: 42 minutes of portal downtime caused by exhausted connection pool.\nAction items: raise pool ceiling, add alert on connection saturation.\n'),
  };
}

function createInitialState() {
  return {
    company: COMPANY,
    currentUser: 'guest',
    privilege: 'guest', // guest | employee | admin | root
    cwd: '/home/guest',
    employees: EMPLOYEES,
    commandHistory: [],
    knownCredentials: [],
    discoveredFiles: [],
    decoyAccessed: [],
    filesystem: buildFilesystem(),
  };
}

module.exports = { createInitialState, EMPLOYEES, COMPANY };
