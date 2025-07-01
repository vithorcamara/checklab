import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SplashScreen from '../src/pages/SplashScreen';
import Login from '../src/pages/LoginPage';
import Home from '../src/pages/HomePage';
import Consulta from './pages/ConsultaPage';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/consulta" element={<Consulta />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
