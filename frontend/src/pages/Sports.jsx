import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, XCircle, Wrench } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const statusConfig = {
  'Available': { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  'Issued': { icon: XCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  'Under Maintenance': { icon: Wrench, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
};

export default function Sports({ onLogout }) {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await axios.get(`${API}/sports/equipment`);
      setEquipment(response.data);
    } catch (error) {
      toast.error('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (equipmentId) => {
    setBookingId(equipmentId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/sports/book`,
        { equipment_id: equipmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Equipment booked successfully!');
      fetchEquipment();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to book equipment';
      toast.error(message);
    } finally {
      setBookingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading equipment...</p>
        </div>
      </div>
    );
  }

  const availableCount = equipment.filter(eq => eq.status === 'Available').length;
  const issuedCount = equipment.filter(eq => eq.status === 'Issued').length;
  const maintenanceCount = equipment.filter(eq => eq.status === 'Under Maintenance').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                data-testid="back-button"
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sports Equipment Tracker</h1>
                <p className="text-xs text-gray-600">Real-time Availability</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8 fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Available</p>
                <p className="text-3xl font-bold text-green-600">{availableCount}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Issued</p>
                <p className="text-3xl font-bold text-yellow-600">{issuedCount}</p>
              </div>
              <XCircle className="w-12 h-12 text-yellow-500 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Maintenance</p>
                <p className="text-3xl font-bold text-red-600">{maintenanceCount}</p>
              </div>
              <Wrench className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Equipment List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 fade-in">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Equipment List</h2>
          
          <div className="space-y-4">
            {equipment.map((item, index) => {
              const config = statusConfig[item.status];
              const Icon = config.icon;
              
              return (
                <div
                  key={item.id}
                  data-testid={`equipment-item-${item.id}`}
                  className={`flex items-center justify-between p-6 rounded-xl border-2 ${config.border} ${config.bg} fade-in`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 ${config.bg} rounded-xl border ${config.border}`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      {item.issued_to && (
                        <p className="text-sm text-gray-600 mt-1">Issued to: {item.issued_to}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge
                      data-testid={`status-badge-${item.id}`}
                      className={`${config.bg} ${config.color} border ${config.border} px-4 py-1.5 text-sm font-semibold`}
                    >
                      {item.status}
                    </Badge>
                    
                    {item.status === 'Available' && (
                      <Button
                        data-testid={`book-button-${item.id}`}
                        onClick={() => handleBook(item.id)}
                        disabled={bookingId === item.id}
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                      >
                        {bookingId === item.id ? 'Booking...' : 'Book Now'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}