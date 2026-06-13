import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Lab from "@/pages/Lab";
import Library from "@/pages/Library";
import Sandbox from "@/pages/Sandbox";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/sandbox" element={<Sandbox />} />
        <Route path="/lab/:experimentId" element={<Lab />} />
      </Routes>
    </Router>
  );
}
