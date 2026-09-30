import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Skills from "./pages/Skills";
import Practice from "./pages/Practice";
import Goals from "./pages/Goals";
import Community from "./pages/Community";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

        <Route
          path="/skills"
          element={<Skills />}
        />

        <Route
          path="/practice"
          element={<Practice />}
        />

        <Route
          path="/goals"
          element={<Goals />}
        />

        <Route
          path="/community"
          element={<Community />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;