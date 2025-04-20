import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Transactions from "./pages/Transactions";
import Inventory from "./pages/Inventory";
import Profile from "./pages/Profile";
import Accounts from "./pages/Accounts";

const App = () => {
    return (
        <React.StrictMode>
            <ThemeProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/billing" element={<Billing />} />
                            <Route path="/transactions" element={<Transactions />} />
                            <Route path="/inventory" element={<Inventory />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/accounts" element={<Accounts />} />
                        </Routes>
                    </BrowserRouter>
                </AuthProvider>
            </ThemeProvider>
        </React.StrictMode>
    );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);