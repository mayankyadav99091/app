import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const statusConfig = {
  'Pending': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  'In Progress': { color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'Resolved': { color: 'bg-green-100 text-green-700 border-green-200' }
};

const categoryConfig = {
  'waste': { label: 'Waste Management', color: 'text-orange-600' },
  'maintenance': { label: 'Maintenance', color: 'text-blue-600' },
  'other': { label: 'Other', color: 'text-gray-600' }
};

// Image compression utility
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const maxSize = 1024;
        if (width > height && width > maxSize) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width / height) * maxSize;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
              resolve({
                base64: reader.result.split(',')[1],
                mimeType: 'image/jpeg'
              });
            };
          },
          'image/jpeg',
          0.7
        );
      };
    };
    reader.onerror = reject;
  });
};

export default function Complaints({ onLogout }) {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: 'waste',
    imageBase64: null,
    mimeType: null
  });

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await axios.get(`${API}/complaints`);
      setComplaints(response.data);
    } catch (error) {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      try {
        const { base64, mimeType } = await compressImage(file);
        setFormData({ ...formData, imageBase64: base64, mimeType });
        toast.success('Image uploaded and compressed');
      } catch (error) {
        toast.error('Failed to process image');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/complaints`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Complaint submitted successfully!');
      setDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        location: '',
        category: 'waste',
        imageBase64: null,
        mimeType: null
      });
      fetchComplaints();
    } catch (error) {
      toast.error('Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading complaints...</p>
        </div>
      </div>
    );
  }

  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const progressCount = complaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
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
                <h1 className="text-2xl font-bold text-gray-900">Report Issues</h1>
                <p className="text-xs text-gray-600">Waste & Maintenance Complaints</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  data-testid="submit-complaint-button"
                  className="gap-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                  Submit Complaint
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Submit a Complaint</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <Input
                      data-testid="form-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Brief summary of the issue"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger data-testid="form-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="waste">Waste Management</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <Textarea
                      data-testid="form-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Provide detailed information about the issue..."
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <Input
                      data-testid="form-location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Academic Block A, Hostel 3"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Image (Optional)
                    </label>
                    <Input
                      data-testid="form-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <p className="text-xs text-gray-500 mt-1">Max 5MB, will be compressed automatically</p>
                  </div>

                  <Button
                    data-testid="submit-form-button"
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Complaint'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
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
                <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-yellow-500 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{progressCount}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Resolved</p>
                <p className="text-3xl font-bold text-green-600">{resolvedCount}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Complaints List */}
        {complaints.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center fade-in">
            <p className="text-gray-600">No complaints yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {complaints.map((complaint, index) => (
              <div
                key={complaint.id}
                data-testid={`complaint-card-${complaint.id}`}
                className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{complaint.title}</h3>
                        <Badge
                          data-testid={`status-badge-${complaint.id}`}
                          className={`${statusConfig[complaint.status].color} border`}
                        >
                          {complaint.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className={`font-medium ${categoryConfig[complaint.category].color}`}>
                          {categoryConfig[complaint.category].label}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {complaint.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(complaint.created_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{complaint.description}</p>
                  
                  {complaint.imageBase64 && (
                    <img
                      src={`data:${complaint.mimeType};base64,${complaint.imageBase64}`}
                      alt={complaint.title}
                      className="w-full max-w-md rounded-lg border border-gray-200"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}