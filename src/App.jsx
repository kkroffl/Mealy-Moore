import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MealyPage from "./pages/MealyPage";
import MoorePage from "./pages/MoorePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/mealy" element={<MealyPage />} />
      <Route path="/moore" element={<MoorePage />} />
    </Routes>
  );
}
