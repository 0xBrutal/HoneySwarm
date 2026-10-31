import { Megaphone, Calendar, FileText } from 'lucide-react';

const DashboardView = ({ simState }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Welcome to the Vertex Dynamics Intranet</h2>
        <p className="mt-2 text-sm text-gray-600">
          You are signed in as <span className="font-mono font-medium">{simState?.currentUser || 'guest'}</span>{' '}
          with <span className="font-medium">{simState?.privilege || 'guest'}</span> clearance.
          Use the navigation on the left to access the terminal, directory, cloud drive, and admin tools.
        </p>
        <div className="mt-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-md border border-blue-100">
            <Megaphone size={18} className="text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Q4 All-Hands — November 6</p>
              <p className="text-xs text-blue-700 mt-0.5">Join us in the main auditorium or via stream. Agenda includes the infra refresh retrospective.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-md border border-gray-100">
            <Calendar size={18} className="text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800">Password rotation reminder</p>
              <p className="text-xs text-gray-500 mt-0.5">Finance team credentials rotate on 2026-11-03. Check your inbox for instructions.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-md border border-gray-100">
            <FileText size={18} className="text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800">Updated security policy published</p>
              <p className="text-xs text-gray-500 mt-0.5">Version 3.2 is available in Cloud Drive → Shared → company_policies.pdf.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Session</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-gray-500">User</dt><dd className="font-mono">{simState?.currentUser}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Clearance</dt><dd className="font-mono">{simState?.privilege}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Home</dt><dd className="font-mono text-xs">{simState?.cwd}</dd></div>
        </dl>
        <p className="mt-6 text-xs text-gray-400">
          Need elevated access? Contact IT Support (ext. 4402) or ask your team lead.
        </p>
      </div>
    </div>
  );
};

export default DashboardView;
