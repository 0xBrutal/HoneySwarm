import { useState, useEffect } from 'react';
import { getDirectory } from '../services/simulationApi';

const DirectoryView = () => {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getDirectory().then((res) => setEmployees(res.employees)).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4">{error}</div>;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Vertex ID</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Phone</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {employees.map((emp) => (
            <tr key={emp.username} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
              <td className="px-4 py-3 font-mono text-gray-600">{emp.username}</td>
              <td className="px-4 py-3 text-gray-600">{emp.department}</td>
              <td className="px-4 py-3 text-gray-600">{emp.role}</td>
              <td className="px-4 py-3 text-gray-600">{emp.email}</td>
              <td className="px-4 py-3 text-gray-600">{emp.phone}</td>
              <td className="px-4 py-3"><span className="inline-flex px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">{emp.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DirectoryView;
