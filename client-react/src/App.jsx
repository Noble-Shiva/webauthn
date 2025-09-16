import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Logger from './components/Logger';
import { LoggerProvider, useLogger } from './context/LoggerContext';

function AppContent() {
  const { logs } = useLogger();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="py-6 bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              WebAuthn Demo
            </h1>
            <div className="flex gap-4">
              <Link to="/">
                <button className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-white border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-300 font-medium shadow-sm hover:shadow-md text-sm sm:text-base">
                  Register
                </button>
              </Link>
              <Link to="/login">
                <button className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-blue-500 border-2 border-blue-500 text-white hover:bg-white hover:text-blue-500 transition-all duration-300 font-medium shadow-sm hover:shadow-md text-sm sm:text-base">
                  Login
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 md:py-12 flex flex-col lg:flex-row gap-8">
        <main className="w-full lg:w-2/5">
          <Routes>
            <Route path="/" element={<Register />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>

        <div className="w-full lg:w-3/5">
          <Logger logs={logs} />
        </div>
      </div>

      <footer className="py-4 text-center text-gray-500 text-sm mt-8">
        Secure authentication with WebAuthn
      </footer>
    </div>
  );
}

function App() {
  return (
    <LoggerProvider>
      <Router>
        <AppContent />
      </Router>
    </LoggerProvider>
  );
}

export default App;
