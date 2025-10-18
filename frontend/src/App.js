import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NetworkScanner from './pages/NetworkScanner';
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<NetworkScanner />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
