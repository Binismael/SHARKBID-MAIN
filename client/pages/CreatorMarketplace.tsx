import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Star, Search as SearchIcon, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { getApprovedCreators } from "@/lib/marketplace-service";
import { Link } from "react-router-dom";

interface Creator {
  id: string;
  bio?: string;
  skills?: string[];
  day_rate?: number;
  user?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
  averageRating: number;
  ratingCount: number;
}

export default function CreatorMarketplace() {
  const { user } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [filterMinRating, setFilterMinRating] = useState(0);
  const [allSkills, setAllSkills] = useState<string[]>([]);

  useEffect(() => {
    loadCreators();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, filterSkill, filterMinRating, creators]);

  const loadCreators = async () => {
    setLoading(true);
    const result = await getApprovedCreators();
    if (result.success) {
      setCreators(result.creators);
      // Extract unique skills
      const skills = new Set<string>();
      result.creators.forEach((c: Creator) => {
        c.skills?.forEach((s) => skills.add(s));
      });
      setAllSkills(Array.from(skills).sort());
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = creators;

    // Search by name or bio
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.user?.name.toLowerCase().includes(searchLower) ||
          c.bio?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by skill
    if (filterSkill) {
      filtered = filtered.filter((c) =>
        c.skills?.some((s) => s === filterSkill)
      );
    }

    // Filter by minimum rating
    if (filterMinRating > 0) {
      filtered = filtered.filter((c) => c.averageRating >= filterMinRating);
    }

    setFilteredCreators(filtered);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating)
                ? "fill-secondary text-secondary"
                : "text-muted-foreground"
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  return (
    <DashboardLayout role="client" userName={user?.email || "Client"}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Creator Marketplace
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Discover and hire talented creators for your projects
          </p>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search creators by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground hover:bg-muted transition"
            >
              <option value="">All Skills</option>
              {allSkills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
            <select
              value={filterMinRating}
              onChange={(e) => setFilterMinRating(parseFloat(e.target.value))}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground hover:bg-muted transition"
            >
              <option value="0">All Ratings</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
            </select>
          </div>
          <p className="text-sm text-muted-foreground">
            Found {filteredCreators.length} creator{filteredCreators.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Creators Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-accent mb-2"></div>
              <p className="text-muted-foreground">Loading creators...</p>
            </div>
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2 font-medium">No creators found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCreators.map((creator) => (
              <Card
                key={creator.id}
                className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border-l-4 border-l-accent"
              >
                <CardContent className="pt-6">
                  {/* Avatar */}
                  <div className="mb-4 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                      {creator.user?.avatar_url ? (
                        <img
                          src={creator.user.avatar_url}
                          alt={creator.user.name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-accent-foreground">
                          {creator.user?.name?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Name & Email */}
                  <h3 className="font-semibold text-center mb-1">
                    {creator.user?.name}
                  </h3>
                  <p className="text-xs text-muted-foreground text-center mb-4">
                    {creator.user?.email}
                  </p>

                  {/* Rating */}
                  <div className="mb-4 flex justify-center">
                    {renderStars(creator.averageRating)}
                  </div>

                  {/* Bio */}
                  {creator.bio && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 text-center">
                      {creator.bio}
                    </p>
                  )}

                  {/* Skills */}
                  {creator.skills && creator.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {creator.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="text-xs bg-accent/10 text-accent px-2 py-1 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {creator.skills.length > 3 && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                            +{creator.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rate */}
                  {creator.day_rate && (
                    <div className="mb-4 text-center">
                      <p className="text-sm text-muted-foreground">Day Rate</p>
                      <p className="text-lg font-bold text-secondary">
                        ${creator.day_rate}/day
                      </p>
                    </div>
                  )}

                  {/* View Profile Button */}
                  <Link to={`/creator/${creator.id}`} className="w-full">
                    <Button className="w-full bg-accent hover:bg-accent/90">
                      <Eye className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
