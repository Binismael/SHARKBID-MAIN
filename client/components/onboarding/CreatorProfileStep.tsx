import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getCreatorProfile } from "@/lib/creator-onboarding-service";

interface CreatorProfileStepProps {
  data: any;
  onDataChange: (data: any) => void;
  onNext: () => void;
}

export default function CreatorProfileStep({
  data,
  onDataChange,
  onNext,
}: CreatorProfileStepProps) {
  const { user } = useAuth();
  const [bio, setBio] = useState(data.bio || "");
  const [experienceYears, setExperienceYears] = useState(
    data.experience_years || 0
  );
  const [skills, setSkills] = useState<string[]>(data.skills || []);
  const [specialties, setSpecialties] = useState<string[]>(
    data.specialties || []
  );
  const [skillInput, setSkillInput] = useState("");
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      const result = await getCreatorProfile(user.id);
      if (result.success && result.profile) {
        setBio(result.profile.bio || "");
        setExperienceYears(result.profile.experience_years || 0);
        setSkills(result.profile.skills || []);
        setSpecialties(result.profile.specialties || []);
      }
      setLoading(false);
    };
    loadProfile();
  }, [user?.id]);

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      const newSkills = [...skills, skillInput.trim()];
      setSkills(newSkills);
      setSkillInput("");
      onDataChange({ ...data, skills: newSkills });
    }
  };

  const handleRemoveSkill = (skill: string) => {
    const newSkills = skills.filter((s) => s !== skill);
    setSkills(newSkills);
    onDataChange({ ...data, skills: newSkills });
  };

  const handleAddSpecialty = () => {
    if (
      specialtyInput.trim() &&
      !specialties.includes(specialtyInput.trim())
    ) {
      const newSpecialties = [...specialties, specialtyInput.trim()];
      setSpecialties(newSpecialties);
      setSpecialtyInput("");
      onDataChange({ ...data, specialties: newSpecialties });
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    const newSpecialties = specialties.filter((s) => s !== specialty);
    setSpecialties(newSpecialties);
    onDataChange({ ...data, specialties: newSpecialties });
  };

  const handleBioChange = (value: string) => {
    setBio(value);
    onDataChange({ ...data, bio: value });
  };

  const handleExperienceChange = (value: string) => {
    const years = parseInt(value) || 0;
    setExperienceYears(years);
    onDataChange({ ...data, experience_years: years });
  };

  const isComplete =
    bio.trim().length > 0 &&
    skills.length > 0 &&
    specialties.length > 0 &&
    experienceYears > 0;

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
        <CardTitle>About You</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bio */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Professional Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => handleBioChange(e.target.value)}
            placeholder="Tell us about your experience, background, and what makes you unique..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none resize-none"
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {bio.length}/500 characters
          </p>
        </div>

        {/* Experience */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Years of Experience
          </label>
          <Input
            type="number"
            value={experienceYears}
            onChange={(e) => handleExperienceChange(e.target.value)}
            placeholder="5"
            min="0"
            max="60"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            How many years have you been working in your field?
          </p>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Core Skills
          </label>
          <div className="flex gap-2 mb-3">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
              placeholder="e.g., Graphic Design, Branding, UI Design..."
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleAddSkill}
              variant="outline"
              className="px-4"
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <div
                key={skill}
                className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:bg-accent/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Add at least 1 skill
          </p>
        </div>

        {/* Specialties */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Specialties
          </label>
          <div className="flex gap-2 mb-3">
            <Input
              value={specialtyInput}
              onChange={(e) => setSpecialtyInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddSpecialty()}
              placeholder="e.g., Logo Design, Brand Identity, Web Design..."
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleAddSpecialty}
              variant="outline"
              className="px-4"
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {specialties.map((specialty) => (
              <div
                key={specialty}
                className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
              >
                {specialty}
                <button
                  onClick={() => handleRemoveSpecialty(specialty)}
                  className="hover:bg-secondary/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Add at least 1 specialty
          </p>
        </div>

        {/* Completion Indicator */}
        {!isComplete && (
          <div className="p-3 bg-accent/10 rounded-lg border border-accent/30">
            <p className="text-sm text-accent font-medium">
              ✓ Complete all fields to continue
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
