import { useEffect, useState } from "react";
import { getMe, updateMe } from "../api/users";
import RatingBadge from "../components/RatingBadge";
import { ProfileSkeleton } from "../components/Skeleton";

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export default function Profile() {
  const [form, setForm] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await getMe();
        setForm({
          name: res.data.name || "",
          bio: res.data.bio || "",
          experienceLevel: res.data.experienceLevel || "beginner",
          emergencyContact: {
            name: res.data.emergencyContact?.name || "",
            phone: res.data.emergencyContact?.phone || "",
          },
        });
        setRatings({
          organizer: res.data.organizerRating,
          participant: res.data.participantRating,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Could not load your profile.");
      }
    }
    load();
  }, []);

  const updateField = (field, value) => {
    setForm({ ...form, [field]: value });
    setSaved(false);
  };

  const updateEmergency = (field, value) => {
    setForm({
      ...form,
      emergencyContact: { ...form.emergencyContact, [field]: value },
    });
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);

    try {
      await updateMe(form);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (error && !form) return <p className="text-red-600">{error}</p>;
  if (!form) return <ProfileSkeleton />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Your Profile</h2>
          <div className="flex flex-wrap gap-4 mt-1">
            <RatingBadge rating={ratings?.organizer} label="organizer" />
            <RatingBadge rating={ratings?.participant} label="participant" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <label className="block text-sm text-gray-600">
              Name
              <input
                className="w-full border p-2 rounded mt-1"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </label>

            <label className="block text-sm text-gray-600">
              Short bio
              <textarea
                className="w-full border p-2 rounded mt-1"
                rows={3}
                placeholder="Tell other travellers a bit about yourself"
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
              />
            </label>

            <label className="block text-sm text-gray-600">
              Experience level
              <select
                className="w-full border p-2 rounded mt-1"
                value={form.experienceLevel}
                onChange={(e) => updateField("experienceLevel", e.target.value)}
              >
                {EXPERIENCE_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div>
              <h3 className="font-semibold">Emergency contact</h3>
              <p className="text-xs text-gray-500">
                Entered once here and reused for every trip you join. Only you can see it.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <input
                className="w-full border p-2 rounded"
                placeholder="Contact name"
                value={form.emergencyContact.name}
                onChange={(e) => updateEmergency("name", e.target.value)}
              />
              <input
                className="w-full border p-2 rounded"
                placeholder="Contact phone"
                type="tel"
                value={form.emergencyContact.phone}
                onChange={(e) => updateEmergency("phone", e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {saved && <p className="text-green-600 text-sm">Profile saved.</p>}

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
