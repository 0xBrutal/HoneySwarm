import { BrowserRouter, Routes, Route } from 'react-router-dom';

function PublicHome() {
  return (
    <div className="p-8 min-h-screen bg-gray-50 text-gray-900">
      <h1 className="text-3xl font-bold text-blue-800">HoneySwarm Public Portal</h1>
      <p className="mt-4 text-lg">Normal visitor experience. (Milestone 1 will build the corporate site)</p>
    </div>
  );
}

function DefenderDashboard() {
  return (
    <div className="p-8 min-h-screen bg-navy text-cyan-400">
      <h1 className="text-3xl font-bold">Defender Dashboard</h1>
      <p className="mt-4 text-lg">Protected workspace. (Milestone 5 will build the SOC interface)</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicHome />} />
        <Route path="/defender" element={<DefenderDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;