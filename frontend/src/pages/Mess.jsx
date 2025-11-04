import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Star, Coffee, UtensilsCrossed, Cookie, Moon } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const mealIcons = {
  breakfast: Coffee,
  lunch: UtensilsCrossed,
  snacks: Cookie,
  dinner: Moon
};

const mealLabels = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner'
};

export default function Mess({ onLogout }) {
  const navigate = useNavigate();
  const [menu, setMenu] = useState(null);
  const [ratings, setRatings] = useState({});
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMenu();
    fetchRatings();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${API}/mess/menu`);
      setMenu(response.data);
    } catch (error) {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      const response = await axios.get(`${API}/mess/ratings`);
      setRatings(response.data);
    } catch (error) {
      console.error('Failed to load ratings');
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/mess/feedback`,
        {
          meal_type: selectedMeal,
          rating,
          comment: comment || undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Feedback submitted successfully!');
      setSelectedMeal(null);
      setRating(0);
      setComment('');
      fetchRatings();
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
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
                <h1 className="text-2xl font-bold text-gray-900">Mess Management</h1>
                <p className="text-xs text-gray-600">Today's Menu & Feedback</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menu Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 fade-in">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Today's Menu</h2>
              
              <div className="space-y-6">
                {menu && Object.entries(menu).filter(([key]) => key !== 'date').map(([mealType, items], index) => {
                  const Icon = mealIcons[mealType];
                  const avgRating = ratings[mealType] || 0;
                  
                  return (
                    <div
                      key={mealType}
                      data-testid={`meal-card-${mealType}`}
                      className="bg-gradient-to-br from-white to-orange-50 rounded-xl p-6 border border-orange-100 fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {Icon && <Icon className="w-6 h-6 text-orange-600" />}
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{mealLabels[mealType]}</h3>
                            {avgRating > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium text-gray-700">{avgRating}/5</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          data-testid={`feedback-button-${mealType}`}
                          onClick={() => setSelectedMeal(mealType)}
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          <Star className="w-4 h-4" />
                          Rate
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {items.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-white rounded-full text-sm text-gray-700 border border-gray-200 shadow-sm"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Feedback Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 sticky top-24 fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit Feedback</h2>
              
              {selectedMeal ? (
                <form onSubmit={handleSubmitFeedback} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating for {mealLabels[selectedMeal]}
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          data-testid={`star-${star}`}
                          type="button"
                          onClick={() => setRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-10 h-10 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments (Optional)
                    </label>
                    <Textarea
                      data-testid="feedback-comment-textarea"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts about the food..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      data-testid="submit-feedback-button"
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white"
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setSelectedMeal(null);
                        setRating(0);
                        setComment('');
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8">
                  <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Select a meal to rate and provide feedback</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}