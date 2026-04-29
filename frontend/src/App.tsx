import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/events/:id" element={<div className="container">Détails de l'événement (Bientôt)</div>} />
            <Route path="/mes-reservations" element={<div className="container">Mes Réservations (Bientôt)</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
