import { BrowserRouter, Routes, Route, Navigate } from 'react-router';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="p-8 text-center"><h1 className="text-3xl font-bold">Lottery Sandbox System</h1><p className="mt-4 text-gray-600">System initializing...</p></div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
