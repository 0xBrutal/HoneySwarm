import { useState, useEffect } from 'react';
import { listFiles, readFileContent } from '../services/simulationApi';
import { Folder, FileText, Lock, ChevronRight } from 'lucide-react';

const CloudDriveView = () => {
  const [path, setPath] = useState('/srv/cloud');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    setError('');
    listFiles(path)
      .then((res) => { setData(res); setPreview(null); })
      .catch((e) => setError(e.message));
  }, [path]);

  const breadcrumbs = path.split('/').filter(Boolean);

  const openEntry = (entry) => {
    if (entry.restricted) { setError(`Access denied: ${entry.name} (insufficient permissions)`); return; }
    if (entry.type === 'dir') setPath(entry.path);
    else {
      setPreviewError('');
      readFileContent(entry.path)
        .then((res) => setPreview(res))
        .catch((e) => setPreviewError(e.message));
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center text-sm text-gray-600 flex-wrap">
        <button className="hover:text-blue-600 font-medium" onClick={() => setPath('/srv/cloud')}>Cloud Drive</button>
        {breadcrumbs.map((b, i) => {
          const target = '/' + breadcrumbs.slice(0, i + 1).join('/');
          return (
            <span key={target} className="flex items-center">
              <ChevronRight size={14} className="mx-1 text-gray-400" />
              <button className="hover:text-blue-600" onClick={() => setPath(target)}>{b}</button>
            </span>
          );
        })}
      </div>

      {error && <div className="m-4 bg-red-50 border border-red-200 text-red-700 rounded px-4 py-2 text-sm">{error}</div>}

      {!data && !error && <div className="p-4 text-sm text-gray-500">Loading...</div>}

      {data && (
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Permissions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {path !== '/srv/cloud' && (
              <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setPath(path.split('/').slice(0, -1).join('/') || '/')}>
                <td className="px-4 py-2 text-blue-600" colSpan={4}>.. (up one level)</td>
              </tr>
            )}
            {data.entries.map((entry) => (
              <tr key={entry.path} className="hover:bg-gray-50 cursor-pointer" onClick={() => openEntry(entry)}>
                <td className="px-4 py-2 flex items-center gap-2">
                  {entry.restricted ? <Lock size={14} className="text-gray-400" /> :
                   entry.type === 'dir' ? <Folder size={14} className="text-blue-500" /> :
                   <FileText size={14} className="text-gray-400" />}
                  <span className={entry.restricted ? 'text-gray-400' : 'text-gray-800'}>{entry.name}{entry.type === 'dir' ? '/' : ''}</span>
                </td>
                <td className="px-4 py-2 text-gray-500">{entry.type === 'dir' ? 'Folder' : 'File'}</td>
                <td className="px-4 py-2 text-gray-500">{entry.owner}</td>
                <td className="px-4 py-2 font-mono text-gray-400">{entry.permissions}</td>
              </tr>
            ))}
            {data.entries.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-4 text-gray-400 text-center">This folder is empty.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {(preview || previewError) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setPreview(null); setPreviewError(''); }}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <span className="font-mono text-sm text-gray-700">{preview ? preview.path : 'Preview unavailable'}</span>
              <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => { setPreview(null); setPreviewError(''); }}>Close</button>
            </div>
            <pre className="p-4 text-sm font-mono text-gray-800 overflow-auto whitespace-pre-wrap">
              {previewError || preview?.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudDriveView;
