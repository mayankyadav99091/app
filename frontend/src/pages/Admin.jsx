import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Shield, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const complaintStatusConfig = {
  'Pending': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  'In Progress': { color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'Resolved': { color: 'bg-green-100 text-green-700 border-green-200' }
};

const equipmentStatusConfig = {
  'Available': { color: 'bg-green-100 text-green-700 border-green-200' },
  'Issued': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  'Under Maintenance': { color: 'bg-red-100 text-red-700 border-red-200' }
};

export default function Admin({ onLogout }) {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [complaintsRes, equipmentRes] = await Promise.all([
        axios.get(`${API}/complaints`),
        axios.get(`${API}/sports/equipment`)
      ]);
      setComplaints(complaintsRes.data);
      setEquipment(equipmentRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (complaintId, newStatus) => {
    setUpdating(complaintId);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/complaints/${complaintId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Complaint status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const updateEquipmentStatus = async (equipmentId, newStatus, issuedTo = null) => {
    setUpdating(equipmentId);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/sports/equipment/${equipmentId}/status`,
        { status: newStatus, issued_to: issuedTo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Equipment status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                data-testid="back-to-dashboard-button"
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                  <p className="text-xs text-gray-600">Manage Complaints & Inventory</p>
                </div>
              </div>
            </div>
            <Button
              data-testid="refresh-button"
              onClick={fetchData}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="complaints" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="complaints" data-testid="tab-complaints">
              Complaints ({complaints.length})
            </TabsTrigger>
            <TabsTrigger value="equipment" data-testid="tab-equipment">
              Equipment ({equipment.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="complaints" className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Complaints</h2>
              
              {complaints.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No complaints to manage</p>
              ) : (
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      data-testid={`admin-complaint-${complaint.id}`}
                      className="border border-gray-200 rounded-xl p-6 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{complaint.title}</h3>
                          <p className="text-gray-700 mb-3">{complaint.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Location: {complaint.location}</span>
                            <span>Category: {complaint.category}</span>
                            <span>Created: {format(new Date(complaint.created_at), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <Badge className={`${complaintStatusConfig[complaint.status].color} border`}>
                            {complaint.status}
                          </Badge>
                          <Select
                            value={complaint.status}
                            onValueChange={(value) => updateComplaintStatus(complaint.id, value)}
                            disabled={updating === complaint.id}
                          >
                            <SelectTrigger data-testid={`status-select-${complaint.id}`} className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Equipment Inventory</h2>
              
              {equipment.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No equipment to manage</p>
              ) : (
                <div className="space-y-4">
                  {equipment.map((item) => (
                    <div
                      key={item.id}
                      data-testid={`admin-equipment-${item.id}`}
                      className="border border-gray-200 rounded-xl p-6 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{item.name}</h3>
                          {item.issued_to && (
                            <p className="text-sm text-gray-600">Issued to: {item.issued_to}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <Badge className={`${equipmentStatusConfig[item.status].color} border`}>
                            {item.status}
                          </Badge>
                          <Select
                            value={item.status}
                            onValueChange={(value) => updateEquipmentStatus(item.id, value)}
                            disabled={updating === item.id}
                          >
                            <SelectTrigger data-testid={`equipment-status-select-${item.id}`} className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Available">Available</SelectItem>
                              <SelectItem value="Issued">Issued</SelectItem>
                              <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}