import { BrowserRouter, Routes, Route } from "react-router-dom";
import ShipLanding from "./pages/ShipLanding";
import Anchorage from "./pages/Anchorage";
import SeaSolve from "./pages/SeaSolve";
import MapPage from "./components/MapPage";
import AdminPage from "./components/AdminPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ShipLanding />} />
        <Route path="/anchorage" element={<Anchorage />} />
        <Route path="/team/:kriyaID/sea/:seaId" element={<SeaSolve />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}