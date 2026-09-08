import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMe, updateMe } from "../api/users";
import { AuthContext } from "../context/AuthContext";
import RatingBadge from "../components/RatingBadge";
import { ProfileSkeleton } from "../components/Skeleton";

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const field =
  "w-full bg-surface border border-line-strong rounded-[10px] px-4 py-3.5 text-base text-ink outline-none focus:border-ink transition-colors";

function FormSection({ title, children }) {
  return (
    <section>
      <h2 className="text-xs tracking-[0.14em] uppercase text-faint m-0 mb-5 pb-3 border-b border-line">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Profile() {
  const { user } = useContext(AuthContext);
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
          isPrivate: Boolean(res.data.isPrivate),
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

  const updateField = (name, value) => {
    setForm({ ...form, [name]: value });
    setSaved(false);
  };

  const updateEmergency = (name, value) => {
    setForm({
      ...form,
      emergencyContact: { ...form.emergencyContact, [name]: value },
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

  if (error && !form)
    return <p className="max-w-[1180px] mx-auto px-8 py-14 text-clay-deep">{error}</p>;
  if (!form) return <ProfileSkeleton />;

  return (
    <main className="max-w-[1180px] mx-auto px-8 pt-14 pb-24">
      <div className="flex flex-wrap gap-7 items-center mb-[34px]">
        <span className="w-[92px] h-[92px] rounded-full bg-forest text-canvas grid place-items-center font-display text-[38px]">
          {form.name?.[0]?.toUpperCase() || "?"}
        </span>
        <div>
          <div className="text-[11px] tracking-[0.16em] uppercase text-faint mb-2">
            Your profile
          </div>
          <h1 className="font-display text-[44px] leading-none m-0 mb-2">
            {form.name || "You"}
          </h1>
          <div className="flex flex-wrap gap-4">
            <RatingBadge rating={ratings?.organizer} label="organizer" />
            <RatingBadge rating={ratings?.participant} label="participant" />
          </div>
        </div>

        {user?.id && (
          <Link
            to={`/users/${user.id}`}
            className="ml-auto border border-line-bold rounded-full px-5 py-3 text-sm hover:border-ink transition-colors"
          >
            View public profile
          </Link>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-12 items-start"
      >
        <div className="flex flex-col gap-10 min-w-0">
          <FormSection title="About you">
            <label className="block mb-5">
              <span className="block text-[13px] text-muted mb-2">Name</span>
              <input
                className={field}
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </label>

            <label className="block mb-5">
              <span className="block text-[13px] text-muted mb-2">Short bio</span>
              <textarea
                className={`${field} leading-[1.55] resize-y`}
                rows={4}
                placeholder="Tell other travellers a bit about yourself"
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
              />
            </label>

            <label className="block max-w-[340px]">
              <span className="block text-[13px] text-muted mb-2">Experience level</span>
              <select
                className={field}
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
          </FormSection>

          <FormSection title="Privacy">
            <label className="flex items-start gap-3.5 bg-surface border border-line rounded-[14px] p-5 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 accent-[#2F5646]"
                checked={form.isPrivate}
                onChange={(e) => updateField("isPrivate", e.target.checked)}
              />
              <span>
                <span className="block text-[15px] font-medium mb-1">
                  Keep my profile private
                </span>
                <span className="block text-sm text-faint leading-[1.55]">
                  {form.isPrivate
                    ? "You don't appear in search. Only people on the same trip as you can open your profile — everyone else sees just your name."
                    : "Anyone signed in can find you in search and read your bio, trip history and reviews."}
                </span>
              </span>
            </label>
          </FormSection>

          <FormSection title="Emergency contact">
            <p className="m-0 mb-5 text-sm text-faint max-w-[56ch]">
              Entered once here and reused for every trip you join. Only you can see it.
            </p>

            <div className="grid sm:grid-cols-2 gap-5">
              <label className="block">
                <span className="block text-[13px] text-muted mb-2">Contact name</span>
                <input
                  className={field}
                  placeholder="Who to call"
                  value={form.emergencyContact.name}
                  onChange={(e) => updateEmergency("name", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="block text-[13px] text-muted mb-2">Contact phone</span>
                <input
                  className={field}
                  type="tel"
                  placeholder="050-0000000"
                  value={form.emergencyContact.phone}
                  onChange={(e) => updateEmergency("phone", e.target.value)}
                />
              </label>
            </div>
          </FormSection>
        </div>

        <aside className="lg:sticky lg:top-24 bg-surface border border-line rounded-[18px] p-7 min-w-0">
          <div className="text-[11px] tracking-[0.16em] uppercase text-faint mb-4">
            Save changes
          </div>

          <p className="m-0 mb-5 text-sm leading-[1.55] text-faint">
            Your name and bio are visible to other travellers. Your emergency contact
            never is.
          </p>

          {error && <p className="text-sm text-clay-deep mb-3">{error}</p>}
          {saved && <p className="text-sm text-forest mb-3">Profile saved.</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-ink text-canvas rounded-full px-5 py-3.5 text-[15px] font-medium hover:bg-clay disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </aside>
      </form>
    </main>
  );
}
