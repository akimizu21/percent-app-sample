import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import DisplayPage from './pages/DisplayPage';
import ControlPage from './pages/ControlPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/display/:gameId" element={<DisplayPage />} />
        <Route path="/control/:gameId" element={<ControlPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;