import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, Utensils, Dumbbell, Package, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, { email });
      const { token, role, name } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('email', email);
      localStorage.setItem('name', name);
      
      onLogin(token, role);
      toast.success(`Welcome, ${name}!`);
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed. Please check your email.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Section */}
        <div className="space-y-6 fade-in">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-3 rounded-2xl shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">Campus Catalyst</h1>
              <p className="text-gray-600 text-sm mt-1">Smart Campus Companion</p>
            </div>
          </div>
          
          <p className="text-lg text-gray-700 leading-relaxed">
            Your one-stop solution for managing campus life at IIIT. Access mess menus, book sports equipment, 
            find lost items, and report maintenance issues - all in one place.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <Utensils className="w-8 h-8 text-teal-600" />
              <div>
                <p className="font-semibold text-gray-900">Mess</p>
                <p className="text-xs text-gray-600">Menu & Feedback</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <Dumbbell className="w-8 h-8 text-cyan-600" />
              <div>
                <p className="font-semibold text-gray-900">Sports</p>
                <p className="text-xs text-gray-600">Equipment Tracker</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <Package className="w-8 h-8 text-teal-600" />
              <div>
                <p className="font-semibold text-gray-900">Lost & Found</p>
                <p className="text-xs text-gray-600">Item Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <AlertCircle className="w-8 h-8 text-cyan-600" />
              <div>
                <p className="font-semibold text-gray-900">Complaints</p>
                <p className="text-xs text-gray-600">Report Issues</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="bg-white p-8 lg:p-12 rounded-3xl shadow-2xl border border-gray-100 fade-in">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in with your IIIT email address</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                data-testid="login-email-input"
                type="email"
                placeholder="your.name@iiitd.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 text-base"
              />
              <p className="text-xs text-gray-500 mt-2">Only @iiit*.ac.in emails are accepted</p>
            </div>

            <Button
              data-testid="login-submit-button"
              type="submit"
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-900 font-medium mb-1">Demo Admin Access</p>
            <p className="text-xs text-blue-700">Use: admin@iiitd.ac.in</p>
          </div>
        </div>
      </div>
    </div>
  );
}