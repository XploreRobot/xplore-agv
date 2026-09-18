import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Monitoring from "./pages/Monitoring";
import Control from "./pages/Control";
import WebSocketTest from "./pages/WebSocketTest";
import OTAPortal from "./pages/OTAPortal";

import ProtectedRoute from "./components/ProtectedRoute";
import DeveloperRoute from "./components/DeveloperRoute";
import Layout from "./components/Layout";


function App() {

  return (

    <Routes>

      {/* =================================================
          WEBSOCKET TEST
      ================================================= */}

      <Route
        path="/ws-test"
        element={<WebSocketTest />}
      />


      {/* =================================================
          PUBLIC
      ================================================= */}

      <Route
        path="/"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />


      {/* =================================================
          DASHBOARD
          
          Jangan dibungkus Layout lagi karena
          Dashboard sudah punya Layout.
      ================================================= */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />


      {/* =================================================
          MONITORING
          
          Jangan dibungkus Layout lagi.
      ================================================= */}

      <Route
        path="/monitoring"
        element={
          <ProtectedRoute>
            <Monitoring />
          </ProtectedRoute>
        }
      />


      {/* =================================================
          CONTROL
          
          Jangan dibungkus Layout lagi.
      ================================================= */}

      <Route
        path="/control"
        element={
          <ProtectedRoute>
            <Control />
          </ProtectedRoute>
        }
      />


      {/* =================================================
          OTA
          
          OTAPortal belum punya Layout sendiri,
          jadi Layout hanya dipasang di sini.
          
          Hanya developer yang boleh masuk.
      ================================================= */}

      <Route
        path="/ota"
        element={
          <ProtectedRoute>

            <DeveloperRoute>

              <Layout>

                <OTAPortal />

              </Layout>

            </DeveloperRoute>

          </ProtectedRoute>
        }
      />

    </Routes>

  );

}

export default App;