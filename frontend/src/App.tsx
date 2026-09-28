import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";

// path="*" so the single-page build also resolves under a GitHub Pages subpath (/repo/).
export default function App() {
  return (
    <Routes>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
