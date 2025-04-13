import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Logs from './pages/Logs'; 
import ForgotPassword from './pages/ForgotPassword'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/forgot-password" element={<ForgotPassword />} /> 
      </Routes>
    </Router>
  );
}

export default App;
