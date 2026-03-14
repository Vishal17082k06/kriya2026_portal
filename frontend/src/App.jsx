import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import ShipLanding from "./pages/ShipLanding";
import Anchorage from "./pages/Anchorage";
import SeaSolve from "./pages/SeaSolve";
import MapPage from "./components/MapPage";
import AdminPage from "./components/AdminPage";
import Signup from "./components/Signup";
import Login from "./components/Login";
import OtpPage from "./pages/OtpPage";
import PirateArena from "./PirateArena";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter basename="/codequest">
      <Routes>
        {/* Public Routes */}
        <Route index element={<Signup />} />
        <Route path="login" element={<Login />} />
        <Route path="otp" element={<OtpPage />} />

        {/* Protected Routes */}
        <Route path="shiplanding" element={<ProtectedRoute><ShipLanding /></ProtectedRoute>} />
        <Route path="anchorage" element={<ProtectedRoute><Anchorage /></ProtectedRoute>} />
        <Route path="team/:kriyaID/sea/:seaId" element={<ProtectedRoute><SeaSolve /></ProtectedRoute>} />
        <Route path="map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
        <Route path="admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="arena" element={<ProtectedRoute><PirateArena /></ProtectedRoute>} />

        {/* 404 handler */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
