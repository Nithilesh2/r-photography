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
      
      {/* Admin Link (hidden in production) */}
      <div className="fixed bottom-4 right-4">
        <Link 
          to="/admin" 
          className="bg-gray-800 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-700 transition-colors"
        >
          Admin
        </Link>
      </div>
    </Router>
  );
}

export default App;