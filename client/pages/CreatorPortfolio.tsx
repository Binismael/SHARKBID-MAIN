import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Star, ArrowLeft, Mail, MapPin, Clock, CheckCircle2, MessageSquare, Heart, Share2, Flag, Zap, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useParams, useNavigate } from "react-router-dom";
import { getCreatorProfile, rateCreator } from "@/lib/marketplace-service";

interface CreatorProfile {
  id: string;
  bio?: string;
  skills?: string[];
  day_rate?: number;
  portfolio?: any[];
  ratings?: any[];
  averageRating: number;
  ratingCount: number;
  user?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
  projects?: any[];
}

export default function CreatorPortfolio() {
  const { creatorId } = useParams<{ creatorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (creatorId) {
      loadProfile();
    }
  }, [creatorId]);

  const loadProfile = async () => {
    if (!creatorId) return;
    setLoading(true);
    const result = await getCreatorProfile(creatorId);
    if (result.success) {
      setProfile(result.profile);
    }
    setLoading(false);
  };

  const handleSubmitRating = async () => {
    if (!user?.id || !creatorId || userRating === 0) return;
    
    setSubmitting(true);
    const result = await rateCreator(creatorId, user.id, userRating, review);
    if (result.success) {
      setReview("");
      setUserRating(0);
      loadProfile();
    }
    setSubmitting(false);
  };

  const renderStars = (rating: number, interactive = false, onChange?: (r: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            onClick={() => onChange?.(i + 1)}
            disabled={!interactive}
            className={interactive ? "cursor-pointer" : ""}
          >
            <Star
              className={`h-4 w-4 ${
                i < Math.floor(rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              } ${interactive ? "hover:fill-yellow-400 hover:text-yellow-400" : ""}`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout role="client" userName={user?.email || "Client"}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-accent"></div>
            </div>
            <p className="text-muted-foreground">Loading creator profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout role="client" userName={user?.email || "Client"}>
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Creator not found</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="client" userName={user?.email || "Client"}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Navigation */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile */}
          <div className="lg:col-span-2 space-y-8">
            {/* Creator Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
              {/* Header Banner */}
              <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20"></div>

              {/* Profile Content */}
              <div className="px-8 pb-8">
                <div className="flex flex-col sm:flex-row gap-6 -mt-16 relative z-10 mb-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="h-32 w-32 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 border-4 border-white dark:border-slate-900 flex items-center justify-center overflow-hidden shadow-md">
                      {profile.user?.avatar_url ? (
                        <img
                          src={profile.user.avatar_url}
                          alt={profile.user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl font-bold text-white">
                          {profile.user?.name?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Creator Info */}
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                          {profile.user?.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            {renderStars(profile.averageRating)}
                            <span className="font-semibold text-foreground ml-1">
                              {profile.averageRating.toFixed(1)}
                            </span>
                            <span className="text-muted-foreground">
                              ({profile.ratingCount})
                            </span>
                          </div>
                          {profile.day_rate && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-foreground">${profile.day_rate}/day</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Verified Creator • Member since 2024</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsFavorite(!isFavorite)}
                          className="p-2 hover:bg-muted rounded-lg transition"
                          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                        </button>
                        <button className="p-2 hover:bg-muted rounded-lg transition">
                          <Share2 className="h-5 w-5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-slate-800">
                  <div>
                    <div className="text-lg font-bold text-foreground">{profile.ratingCount}</div>
                    <div className="text-xs text-muted-foreground">Reviews</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{profile.projects?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Orders</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground flex items-center gap-1">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Fast
                    </div>
                    <div className="text-xs text-muted-foreground">Response</div>
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            {profile.bio && (
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-8 shadow-sm">
                <h2 className="text-xl font-bold mb-4">About</h2>
                <p className="text-foreground/80 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Skills Section */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-8 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-accent" />
                  Skills & Expertise
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-4 py-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Section */}
            {profile.portfolio && profile.portfolio.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-gray-200 dark:border-slate-800">
                  <h2 className="text-xl font-bold">Portfolio</h2>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {profile.portfolio.map((item) => (
                      <div
                        key={item.id}
                        className="group rounded-lg overflow-hidden border border-gray-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300 cursor-pointer"
                      >
                        <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-800 dark:to-slate-700 overflow-hidden">
                          {item.image_url ? (
                            <>
                              <img
                                src={item.image_url}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                            </>
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="p-4 space-y-2">
                          <h4 className="font-semibold text-foreground line-clamp-1">
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent/80 transition"
                            >
                              View Project →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-gray-200 dark:border-slate-800">
                <h2 className="text-xl font-bold">Customer Reviews ({profile.ratings?.length || 0})</h2>
              </div>
              <div className="p-8">
                {profile.ratings && profile.ratings.length > 0 ? (
                  <div className="space-y-6">
                    {profile.ratings.map((rating) => (
                      <div key={rating.id} className="pb-6 border-b border-gray-200 dark:border-slate-800 last:border-b-0 last:pb-0">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0 text-white font-semibold">
                            {rating.client?.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-semibold text-foreground">
                                  {rating.client?.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {renderStars(rating.rating)}
                                  <span className="text-xs text-muted-foreground">Verified order</span>
                                </div>
                              </div>
                            </div>
                            {rating.review && (
                              <p className="text-sm text-foreground/80 mt-3 leading-relaxed">
                                {rating.review}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No reviews yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Contact & Review Form */}
          <div className="lg:col-span-1 space-y-6 h-fit sticky top-4">
            {/* Contact Card */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-8 shadow-sm">
              <Button className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-6 h-auto mb-3">
                Contact Creator
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground text-center justify-center">
                <Clock className="h-4 w-4" />
                Usually replies in 2 hours
              </div>
            </div>

            {/* Review Form */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4">Share Your Experience</h3>
              
              <div className="space-y-4">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Your Rating</label>
                  <div className="flex gap-2">
                    {renderStars(userRating, true, setUserRating)}
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Your Review</label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value.slice(0, 500))}
                    placeholder="Share your experience..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{review.length}/500</p>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmitRating}
                  disabled={submitting || userRating === 0}
                  className="w-full bg-accent hover:bg-accent/90 text-white font-semibold h-auto py-2"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </div>

            {/* Creator Stats Card */}
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900 p-6">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-foreground/80">Verified Creator</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-foreground/80">Top Rated Creator</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span className="text-foreground/80">Fast Turnaround</span>
                </div>
              </div>
            </div>

            {/* Report Card */}
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition">
              <Flag className="h-4 w-4" />
              Report Creator
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
