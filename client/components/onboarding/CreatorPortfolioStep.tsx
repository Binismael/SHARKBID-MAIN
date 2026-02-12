import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getPortfolioItems } from "@/lib/creator-onboarding-service";

interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  project_type: string;
  image_url: string;
  external_url?: string;
  skills_used: string[];
  client_name?: string;
  completion_date: string;
  featured: boolean;
}

interface CreatorPortfolioStepProps {
  items: PortfolioItem[];
  onItemsChange: (items: PortfolioItem[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function CreatorPortfolioStep({
  items,
  onItemsChange,
  onNext,
  onBack,
}: CreatorPortfolioStepProps) {
  const { user } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(items);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState<Partial<PortfolioItem>>({
    title: "",
    description: "",
    project_type: "design",
    image_url: "",
    skills_used: [],
    client_name: "",
    completion_date: "",
    featured: false,
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    const loadPortfolio = async () => {
      if (!user?.id) return;
      const result = await getPortfolioItems(user.id);
      if (result.success) {
        setPortfolioItems(result.items);
      }
      setLoading(false);
    };
    loadPortfolio();
  }, [user?.id]);

  const handleAddPortfolioItem = () => {
    if (
      !newItem.title ||
      !newItem.image_url ||
      !newItem.completion_date
    ) {
      alert("Please fill in title, image URL, and completion date");
      return;
    }

    const item: PortfolioItem = {
      title: newItem.title,
      description: newItem.description || "",
      project_type: newItem.project_type || "design",
      image_url: newItem.image_url,
      external_url: newItem.external_url,
      skills_used: newItem.skills_used || [],
      client_name: newItem.client_name,
      completion_date: newItem.completion_date,
      featured: newItem.featured || false,
    };

    const updated = [...portfolioItems, item];
    setPortfolioItems(updated);
    onItemsChange(updated);

    // Reset form
    setNewItem({
      title: "",
      description: "",
      project_type: "design",
      image_url: "",
      skills_used: [],
      client_name: "",
      completion_date: "",
      featured: false,
    });
    setSkillInput("");
    setIsAdding(false);
  };

  const handleDeleteItem = (index: number) => {
    const updated = portfolioItems.filter((_, i) => i !== index);
    setPortfolioItems(updated);
    onItemsChange(updated);
  };

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      const skills = newItem.skills_used || [];
      if (!skills.includes(skillInput.trim())) {
        const updated = [...skills, skillInput.trim()];
        setNewItem({ ...newItem, skills_used: updated });
        setSkillInput("");
      }
    }
  };

  const handleRemoveSkill = (skill: string) => {
    const skills = (newItem.skills_used || []).filter((s) => s !== skill);
    setNewItem({ ...newItem, skills_used: skills });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Portfolio Items List */}
        {portfolioItems.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Your Portfolio Items</p>
            {portfolioItems.map((item, idx) => (
              <div
                key={idx}
                className="p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex gap-4 items-start">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.project_type}
                    </p>
                    {item.client_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Client: {item.client_name}
                      </p>
                    )}
                    {item.skills_used && item.skills_used.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.skills_used.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs bg-accent/10 text-accent px-2 py-1 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(idx)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Portfolio Item Form */}
        {!isAdding ? (
          <Button
            onClick={() => setIsAdding(true)}
            variant="outline"
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Portfolio Item
          </Button>
        ) : (
          <div className="p-4 border-2 border-dashed border-border rounded-lg space-y-4">
            <p className="text-sm font-medium">Add Portfolio Item</p>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Project Title *
              </label>
              <Input
                value={newItem.title || ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, title: e.target.value })
                }
                placeholder="e.g., E-commerce Website Redesign"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Description
              </label>
              <textarea
                value={newItem.description || ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, description: e.target.value })
                }
                placeholder="Brief description of the project..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none resize-none text-sm"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Image URL *
              </label>
              <Input
                value={newItem.image_url || ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, image_url: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
              />
              {newItem.image_url && (
                <img
                  src={newItem.image_url}
                  alt="Preview"
                  className="mt-2 w-full max-h-40 object-cover rounded-lg"
                />
              )}
            </div>

            {/* Project Type */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Project Type
              </label>
              <select
                value={newItem.project_type || "design"}
                onChange={(e) =>
                  setNewItem({ ...newItem, project_type: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              >
                <option value="design">Design</option>
                <option value="development">Development</option>
                <option value="branding">Branding</option>
                <option value="video">Video</option>
                <option value="copywriting">Copywriting</option>
                <option value="photography">Photography</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Client Name */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Client Name
              </label>
              <Input
                value={newItem.client_name || ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, client_name: e.target.value })
                }
                placeholder="Optional: Client company name"
              />
            </div>

            {/* Completion Date */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Completion Date *
              </label>
              <Input
                type="date"
                value={newItem.completion_date || ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, completion_date: e.target.value })
                }
              />
            </div>

            {/* Skills Used */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Skills Used
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                  placeholder="e.g., Figma, React, Branding..."
                  className="text-sm"
                />
                <Button
                  type="button"
                  onClick={handleAddSkill}
                  variant="outline"
                  size="sm"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(newItem.skills_used || []).map((skill) => (
                  <span
                    key={skill}
                    className="text-xs bg-accent/10 text-accent px-2 py-1 rounded flex items-center gap-1"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:opacity-70"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Featured */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newItem.featured || false}
                onChange={(e) =>
                  setNewItem({ ...newItem, featured: e.target.checked })
                }
              />
              <span className="text-sm">
                Feature this item on your profile
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewItem({
                    title: "",
                    description: "",
                    project_type: "design",
                    image_url: "",
                    skills_used: [],
                    client_name: "",
                    completion_date: "",
                    featured: false,
                  });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPortfolioItem}
                className="flex-1 bg-accent hover:bg-accent/90"
              >
                Add Item
              </Button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="p-3 bg-accent/10 rounded-lg border border-accent/30">
          <p className="text-sm text-accent font-medium">
            💡 Portfolio items help clients see your work quality. Start with at
            least 2-3 items.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
