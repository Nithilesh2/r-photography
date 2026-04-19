import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import QuotationForm from './components/QuotationForm';
import AdminDashboard from './components/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<QuotationForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;