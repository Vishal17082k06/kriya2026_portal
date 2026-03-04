import { BrowserRouter, Routes, Route } from "react-router-dom";
import ShipLanding from "./pages/ShipLanding";
import Anchorage from "./pages/Anchorage";
import SeaSolve from "./pages/SeaSolve";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ShipLanding />} />
        <Route path="/anchorage" element={<Anchorage />} />
        <Route path="/sea/:id" element={<SeaSolve />} />
      </Routes>
    </BrowserRouter>
  );
}