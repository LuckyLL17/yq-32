import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Lab from "@/pages/Lab";
import Library from "@/pages/Library";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/lab/:experimentId" element={<Lab />} />
      </Routes>
    </Router>
  );
}
