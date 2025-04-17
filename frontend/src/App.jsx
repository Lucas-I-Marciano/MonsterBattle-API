import { Routes, Route } from "react-router";
import { Battle } from "./pages/Battle";

const Home = () => {
  return (
    <h1 className="w-full text-center text-2xl font-bold bg-blue-100">Home</h1>
  );
};

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
