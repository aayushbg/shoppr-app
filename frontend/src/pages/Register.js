import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const Register = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        city: "",
        branch: "",
        GSTIN: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const registerResponse = await fetch("http://localhost:4000/api/admin/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    city: formData.city,
                    branch: formData.branch,
                    GSTIN: formData.GSTIN
                }),
            });

            const registerData = await registerResponse.json();

            if (!registerResponse.ok) {
                throw new Error(registerData.message || "Registration failed");
            }

            const loginResponse = await fetch("http://localhost:4000/api/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                }),
            });

            const loginData = await loginResponse.json();

            if (!loginResponse.ok) {
                console.warn("Login after registration failed:", loginData.message || loginResponse.status);
                setError("Registration successful, but auto-login failed. Please log in manually.");
            } else if (loginData.accessToken && loginData.user) {
                const loginPayload = {
                    token: loginData.accessToken,
                    user: loginData.user
                };
                login(loginPayload);
                navigate("/dashboard");
            } else {
                console.error('Invalid response structure from login API (after registration):', loginData);
                throw new Error("Login after registration failed: Invalid data received.");
            }
        } catch (err) {
            console.error("Registration/Login error:", err);
            setError(err.message || "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = "w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm";

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-slate-900 to-slate-700 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <h1 className="font-mono text-3xl text-center text-sky-500 mb-6">shoppr</h1>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Create Your Account</h2>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-700">Full Name</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={inputStyle} required disabled={loading} />
                        </div>
                        <div>
                            <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">Email Address</label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={inputStyle} placeholder="you@example.com" required disabled={loading} />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block mb-1 text-sm font-medium text-gray-700">Phone Number</label>
                            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={inputStyle} required disabled={loading} />
                        </div>
                        <div>
                            <label htmlFor="city" className="block mb-1 text-sm font-medium text-gray-700">City</label>
                            <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} className={inputStyle} required disabled={loading} />
                        </div>
                         <div>
                            <label htmlFor="branch" className="block mb-1 text-sm font-medium text-gray-700">Branch</label>
                            <input type="text" id="branch" name="branch" value={formData.branch} onChange={handleChange} className={inputStyle} required disabled={loading} />
                        </div>
                         <div>
                            <label htmlFor="GSTIN" className="block mb-1 text-sm font-medium text-gray-700">GSTIN</label>
                            <input type="text" id="GSTIN" name="GSTIN" value={formData.GSTIN} onChange={handleChange} className={inputStyle} required disabled={loading} />
                        </div>
                         <div>
                            <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">Password</label>
                            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} className={inputStyle} placeholder="••••••••" required disabled={loading} />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700">Confirm Password</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={inputStyle} placeholder="••••••••" required disabled={loading} />
                        </div>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out mt-6"
                    >
                         {loading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                         ) : (
                            'Register'
                        )}
                    </button>
                </form>
                
                <p className="mt-8 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;