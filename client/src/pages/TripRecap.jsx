import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRecap, addTripPhoto, deleteTripPhoto } from "../api/trips";
import { API_ORIGIN } from "../api/axios";
import { Skeleton } from "../components/Skeleton";

const TYPE_LABELS = {
  relaxed: "Relaxed",
  trek: "Trek",
  climbing: "Climbing",
  other: "Other",
};

function formatDate(d) {
  return d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
}

function Stat({ value, label }) {
  return (
    <div>
      <div className="font-display text-[34px] leading-none">{value}</div>
      <div className="text-xs tracking-[0.1em] uppercase text-faint mt-1.5">{label}</div>
    </div>
  );
}

export default function TripRecap() {
  const { id } = useParams();
  const [recap, setRecap] = useState(null);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const res = await getRecap(id);
      setRecap(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load the recap.");
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);
    try {
      await addTripPhoto(id, file, caption);
      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (err) {
      setUploadError(err.response?.data?.message || "Couldn't add that photo.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (photoId) => {
    try {
      await deleteTripPhoto(id, photoId);
      await load();
    } catch (err) {
      setUploadError(err.response?.data?.message || "Couldn't remove that photo.");
    }
  };

  if (error) {
    return (
      <main className="max-w-[1180px] mx-auto px-8 pt-14 pb-24">
        <div className="border border-dashed border-line-strong rounded-2xl px-[26px] py-[44px] text-center max-w-[620px] mx-auto">
          <h1 className="font-display text-[30px] m-0 mb-3">No recap yet</h1>
          <p className="m-0 mb-6 text-muted">{error}</p>
          <Link
            to={`/trip/${id}`}
            className="inline-flex items-center gap-2 bg-ink text-canvas rounded-full px-[22px] py-3 text-sm font-medium hover:bg-clay transition-colors"
          >
            Back to the trip
          </Link>
        </div>
      </main>
    );
  }

  if (!recap) {
    return (
      <main className="max-w-[1180px] mx-auto px-8 pt-14 pb-24 space-y-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </main>
    );
  }

  const { trip, stats, photos, reviews } = recap;
  const everyone = [trip.organizer, ...trip.members];

  return (
    <main className="max-w-[1180px] mx-auto px-8 pt-14 pb-24">
      <Link
        to={`/trip/${trip._id}`}
        className="inline-flex items-center gap-2 text-[13px] text-faint hover:text-ink mb-[26px] transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        Back to the trip
      </Link>

      <div className="max-w-[720px] mb-10">
        <div className="text-[11px] tracking-[0.16em] uppercase text-clay mb-3.5">
          Trip recap · {TYPE_LABELS[trip.type] || "Other"}
        </div>
        <h1 className="font-display text-[52px] leading-[1.03] tracking-[-0.02em] m-0 mb-4 text-pretty">
          {trip.title}
        </h1>
        <p className="m-0 text-[17px] leading-[1.6] text-muted">
          {
            // Built from what's actually recorded, so a trip with no
            // dates doesn't render a stray separator.
            [
              trip.startDate &&
                formatDate(trip.startDate) +
                  (trip.endDate ? ` – ${formatDate(trip.endDate)}` : ""),
              trip.meetingLocation && `from ${trip.meetingLocation}`,
            ]
              .filter(Boolean)
              .join(" · ") || "A trip that has come and gone."
          }
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-[26px] border-y border-line mb-14">
        <Stat value={stats.people} label={stats.people === 1 ? "Traveller" : "Travellers"} />
        {stats.nights !== null && (
          <Stat value={stats.nights} label={stats.nights === 1 ? "Night" : "Nights"} />
        )}
        <Stat value={stats.stops} label={stats.stops === 1 ? "Stop" : "Stops"} />
        <Stat
          value={stats.averageScore !== null ? `★ ${stats.averageScore}` : "—"}
          label={stats.reviews > 0 ? `From ${stats.reviews} reviews` : "No ratings"}
        />
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-12 items-start">
        <div className="flex flex-col gap-12 min-w-0">
          <section>
            <h2 className="font-display text-[26px] m-0 mb-5">Photos</h2>

            {photos.length === 0 ? (
              <p className="text-[15px] text-faint m-0 mb-5">
                Nobody has added a photo yet. Yours would be the first.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {photos.map((p) => (
                  <figure
                    key={p._id}
                    className="m-0 bg-surface border border-line rounded-2xl overflow-hidden"
                  >
                    <img
                      src={`${API_ORIGIN}${p.url}`}
                      alt={p.caption || `Photo from ${trip.title}`}
                      loading="lazy"
                      className="w-full h-[220px] object-cover bg-map"
                    />
                    <figcaption className="px-4 py-3">
                      {p.caption && (
                        <p className="m-0 text-sm text-ink-soft mb-1">{p.caption}</p>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-faint">
                          Added by {p.uploader?.name}
                        </span>
                        {p.isMine && (
                          <button
                            onClick={() => removePhoto(p._id)}
                            className="text-xs text-faint hover:text-clay transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}

            <div className="border border-dashed border-line-bold rounded-[14px] p-5">
              <input
                className="w-full bg-surface border border-line-strong rounded-[10px] px-4 py-3 text-[15px] outline-none focus:border-ink transition-colors mb-3"
                placeholder="Caption (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={200}
              />

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleUpload}
                disabled={uploading}
                className="block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-ink file:text-canvas file:px-5 file:py-2.5 file:text-sm file:font-medium hover:file:bg-clay file:cursor-pointer"
              />

              <p className="text-xs text-faint mt-2 mb-0">
                {uploading ? "Adding…" : "JPEG, PNG, WebP or GIF · up to 5 MB"}
              </p>

              {uploadError && (
                <p className="text-sm text-clay-deep mt-2 mb-0">{uploadError}</p>
              )}
            </div>
          </section>

          {reviews.length > 0 && (
            <section>
              <h2 className="font-display text-[26px] m-0 mb-5">What people said</h2>
              <div className="flex flex-col gap-3">
                {reviews.map((r) => (
                  <article
                    key={r._id}
                    className="bg-surface border border-line rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-[15px] font-medium">
                        {r.reviewer?.name} → {r.reviewee?.name}
                      </span>
                      <span className="text-clay text-sm">{"★".repeat(r.score)}</span>
                    </div>
                    {r.comment && (
                      <p className="m-0 text-[15px] leading-[1.6] text-muted">
                        {r.comment}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {trip.lodgingPlan?.length > 0 && (
            <section>
              <h2 className="font-display text-[26px] m-0 mb-5">Where you slept</h2>
              <ol className="list-none m-0 p-0">
                {trip.lodgingPlan.map((night, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-baseline gap-x-3 py-3.5 border-t border-line"
                  >
                    <span className="font-display text-[20px]">Night {i + 1}</span>
                    <span className="text-[15px]">
                      {night.location || "Location not recorded"}
                    </span>
                    <span className="text-[13px] text-faint ml-auto">{night.type}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 bg-surface border border-line rounded-[18px] p-[26px]">
          <div className="text-[11px] tracking-[0.16em] uppercase text-faint mb-4">
            Who came
          </div>

          <div className="flex flex-col gap-3.5">
            {everyone.map((p, i) => (
              <Link
                key={p._id}
                to={`/users/${p._id}`}
                className="flex items-center gap-3 group"
              >
                <span
                  className={`w-[34px] h-[34px] rounded-full grid place-items-center text-[13px] text-canvas ${
                    i === 0 ? "bg-forest" : "bg-clay"
                  }`}
                >
                  {p.name?.[0]?.toUpperCase() || "?"}
                </span>
                <div>
                  <div className="text-sm font-medium group-hover:text-clay transition-colors">
                    {p.name}
                  </div>
                  <div className="text-xs text-faint">
                    {i === 0 ? "Organizer" : "Participant"}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {trip.costPerPerson > 0 && (
            <div className="mt-5 pt-5 border-t border-line">
              <div className="text-[11px] tracking-[0.1em] uppercase text-faint mb-1.5">
                Cost per person
              </div>
              <div className="font-display text-[26px]">₪{trip.costPerPerson}</div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
