import { Routes, Route } from "react-router";
import { Battle } from "./pages/Battle";
import { Home } from "./pages/Home";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/battle" element={<Battle />} />
      </Routes>
    </>
  );
}
export default App;
