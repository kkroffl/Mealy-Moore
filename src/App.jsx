import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MealyPage from "./pages/MealyPage";
import MoorePage from "./pages/MoorePage";
import { DfaProvider } from "./layouts/DfaContext";

export default function App() {
  return (
    <DfaProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
          {/* GLOBAL HEADER */}
          <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <Link
                to="/"
                className="flex items-center gap-2 transition transform hover:scale-[1.01]"
              >
                {/* Logo Icon */}
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-lg">Σ</span>
                </div>
                {/* Header Title */}
                <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-purple-600 tracking-tight">
                  Finite State Automata Simulator
                </h1>
              </Link>

              <div className="hidden sm:block text-xs font-bold text-slate-400 uppercase tracking-widest">
                DFA to Mealy & Moore
              </div>
            </div>
          </header>

          {/* MAIN PAGE CONTENT */}
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/mealy" element={<MealyPage />} />
              <Route path="/moore" element={<MoorePage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </DfaProvider>
  );
}
