import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import logo from "../../assets/uhwf-logo.webp";
import heroImage from "../../assets/conservation.webp";

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const api = axios.create({ baseURL: '/api', withCredentials: true });
            const res = await api.post('/auth/forgot-password', { email });
            setMessage(res.data.message || "Check your email for reset link.");
        } catch (err: any) {
            setMessage(err.response?.data?.error || "Something went wrong.");
        }
    };

    return (
        <div className="grid min-h-screen lg:grid-cols-2">
            {/* Left: brand panel (desktop only) */}
            <div className="relative hidden lg:block">
                <img
                    src={heroImage}
                    alt="Environment conservation in Tanzania"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-green-950/75" />
                <div className="relative flex h-full flex-col justify-between p-12 text-white">
                    <Link to="/" className="flex items-center gap-3">
                        <img src={logo} alt="UHWF logo" className="h-12 w-auto" />
                        <span className="text-xl font-bold">UHWF-TANZANIA</span>
                    </Link>
                    <div>
                        <h2 className="text-4xl font-bold leading-tight">
                            Reset your password
                        </h2>
                        <p className="mt-4 max-w-md text-green-100">
                            Enter your email address to receive a secure reset link.
                        </p>
                    </div>
                    <p className="text-sm text-green-200/70">
                        © {new Date().getFullYear()} UHWF-TANZANIA
                    </p>
                </div>
            </div>

            {/* Right: form */}
            <div className="flex flex-col justify-center px-6 py-10 sm:px-12">
                <div className="mx-auto w-full max-w-md">
                    {/* Logo shown on mobile only */}
                    <div className="mb-6 flex items-center gap-2 lg:hidden">
                        <img src={logo} alt="UHWF logo" className="h-10 w-auto" />
                        <span className="text-lg font-bold text-green-800">UHWF-TANZANIA</span>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900">Forgot Password</h1>
                    <p className="mt-2 text-gray-500">
                        Enter your email to receive a reset link.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Email address
                            </label>
                            <input
                                type="email"
                                id="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 
                           text-gray-900 placeholder-gray-400 outline-none transition 
                           focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full rounded-lg bg-green-700 py-3 font-semibold text-white 
                         transition-colors hover:bg-green-800 focus:outline-none 
                         focus:ring-2 focus:ring-green-500"
                        >
                            Send Reset Link
                        </button>
                    </form>

                    {message && (
                        <p className="mt-4 text-center text-sm text-green-600">{message}</p>
                    )}

                    <p className="mt-8 text-center text-sm text-gray-500">
                        Remembered your password?{" "}
                        <Link
                            to="/login"
                            className="font-semibold text-green-700 hover:text-green-900"
                        >
                            Back to login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
