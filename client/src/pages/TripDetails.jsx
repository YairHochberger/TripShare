import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  getTrip,
  requestJoin,
  decideJoinRequest,
  updateTripStatus,
  createReview,
  getTripReviews,
  leaveTrip,
  getTripMessages,
  sendTripMessage,
  getJoinRequestMessages,
  sendJoinRequestMessage,
} from "../api/trips";
import ChatThread from "../components/ChatThread";
import RatingBadge from "../components/RatingBadge";
import ReviewForm from "../components/ReviewForm";
import TripMap from "../components/TripMap";
import TripTabs from "../components/TripTabs";
import ProposedChanges from "../components/ProposedChanges";
import TripWeather from "../components/TripWeather";
import { TripDetailsSkeleton } from "../components/Skeleton";

const TYPE_LABELS = {
  relaxed: "Relaxed",
  trek: "Trek",
  climbing: "Climbing",
  other: "Other",
};

const LODGING_LABELS = {
  tent: "Tent",
  cabin: "Cabin",
  hostel: "Hostel",
  host_home: "Host's home",
  other: "Other",
};

const TRAVEL_LABELS = {
  independent: "Independent travel",
  shared: "Shared travel",
  other: "Other",
};

const STATUS_TONE = {
  open: "text-forest bg-forest-mist",
  full: "text-clay bg-clay/10",
  locked: "text-muted bg-surface-sunk",
  completed: "text-forest bg-forest-mist",
  cancelled: "text-clay-deep bg-clay/10",
};

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function shortDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// Only ever link out to real web addresses - anything else (javascript:,
// data:, a typo) is shown as plain text instead of becoming a link.
function safeUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

function SectionHeading({ children, aside }) {
  return (
    <div className="flex items-baseline justify-between gap-4 mb-3.5">
      <h2 className="font-display text-[26px] m-0">{children}</h2>
      {aside}
    </div>
  );
}

function Fact({ label, children }) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.1em] uppercase text-faint mb-1.5">
        {label}
      </div>
      <div className="text-[15px]">{children}</div>
    </div>
  );
}

function Avatar({ name, tone = "forest", size = 34 }) {
  const bg = tone === "clay" ? "bg-clay" : tone === "sand" ? "bg-surface-sunk" : "bg-forest";
  const fg = tone === "sand" ? "text-muted" : "text-canvas";

  return (
    <span
      className={`shrink-0 rounded-full grid place-items-center ${bg} ${fg}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {name?.[0]?.toUpperCase() || "?"}
    </span>
  );
}

export default function TripDetails() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [trip, setTrip] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const [leaveResult, setLeaveResult] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);

  // Present when you arrived through an invite link to a private trip.
  const invite = searchParams.get("invite");

  const loadTrip = async () => {
    try {
      const res = await getTrip(id, invite);
      setTrip(res.data);
      setLoadError("");

      if (res.data.status === "completed") {
        const reviewRes = await getTripReviews(id);
        setReviews(reviewRes.data);
      }
    } catch (err) {
      setLoadError(err.response?.data?.message || "Couldn't load this trip.");
    }
  };

  useEffect(() => {
    loadTrip();
  }, [id]);

  const runAction = async (fn) => {
    setActionError("");
    setActionLoading(true);
    try {
      await fn();
      await loadTrip();
    } catch (err) {
      setActionError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionError("");
    setActionLoading(true);
    try {
      const res = await leaveTrip(trip._id);
      setLeaveResult(res.data);
      await loadTrip();
    } catch (err) {
      setActionError(err.response?.data?.message || "Could not leave the trip.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loadError) {
    return (
      <main className="max-w-[1180px] mx-auto px-8 pt-14 pb-24">
        <div className="border border-dashed border-line-strong rounded-2xl px-[26px] py-[44px] text-center max-w-[620px] mx-auto">
          <h1 className="font-display text-[30px] m-0 mb-3">This trip is private</h1>
          <p className="m-0 mb-6 text-muted">{loadError}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-ink text-canvas rounded-full px-[22px] py-3 text-sm font-medium hover:bg-clay transition-colors"
          >
            Back to trips
          </Link>
        </div>
      </main>
    );
  }

  if (!trip) return <TripDetailsSkeleton />;

  const isFinished = trip.status === "completed";
  const dueDate = trip.paymentDueDate ? new Date(trip.paymentDueDate) : null;
  const duePassed = dueDate ? Date.now() >= dueDate.getTime() : false;

  // The exact price is confirmed later; until then the estimate stands in.
  const finalCost = trip.costPerPerson > 0 ? trip.costPerPerson : null;
  const estimate = trip.estimatedCost > 0 ? trip.estimatedCost : null;
  const hasCost = Boolean(finalCost || estimate);
  const pendingCount = trip.joinRequests?.length || 0;
  const canChat = Boolean(trip.role || trip.myJoinRequestId);

  // No real payment gateway: this opens the user's mail app with a
  // draft to the organizer, per the project's payment approach.
  const payNowHref = () => {
    const subject = `Payment for ${trip.title}`;
    const body = [
      `Hi ${trip.organizer?.name || ""},`,
      "",
      `I'm sending payment for the trip "${trip.title}".`,
      `Amount: ₪${trip.costPerPerson} per person`,
      dueDate ? `Payment due: ${formatDate(trip.paymentDueDate)}` : "",
      "",
      "Thanks!",
    ]
      .filter(Boolean)
      .join("\n");

    return `mailto:${trip.organizer?.email || ""}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  // Organizer rates each participant; participants rate the organizer.
  const peopleToReview = !isFinished
    ? []
    : (trip.role === "organizer"
        ? trip.members
        : trip.role === "participant"
        ? [trip.organizer]
        : []
      ).filter((p) => !trip.reviewedUserIds?.includes(String(p._id)));

  const tabs = [
    { key: "overview", label: "Overview" },
    // Proposals are only readable by people on the trip.
    ...(trip.role ? [{ key: "proposals", label: "Proposals" }] : []),
    { key: "route", label: "Route" },
    ...(canChat ? [{ key: "chat", label: "Chat" }] : []),
    { key: "people", label: "People", badge: pendingCount },
    ...(isFinished && trip.role ? [{ key: "reviews", label: "Reviews" }] : []),
  ];

  const requested = searchParams.get("tab");
  const activeTab = tabs.some((t) => t.key === requested) ? requested : "overview";

  const setActiveTab = (key) => {
    searchParams.set("tab", key);
    setSearchParams(searchParams, { replace: true });
  };

  const dates =
    trip.startDate && trip.endDate
      ? `${shortDate(trip.startDate)} – ${formatDate(trip.endDate)}`
      : formatDate(trip.startDate) || "Not set";

  return (
    <main className="max-w-[1180px] mx-auto px-8 pt-10 pb-24">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-[13px] text-faint hover:text-ink mb-[26px] transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        All trips
      </Link>

      {/* Header */}
      <div className="flex flex-wrap gap-8 justify-between items-start">
        <div className="max-w-[640px]">
          <div className="flex items-center gap-3 mb-3.5">
            <span
              className={`inline-flex items-center gap-[7px] text-[11px] tracking-[0.14em] uppercase px-[11px] py-1.5 rounded-full ${
                STATUS_TONE[trip.status] || STATUS_TONE.open
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {trip.status}
            </span>
            <span className="text-[11px] tracking-[0.14em] uppercase text-faint">
              {TYPE_LABELS[trip.type] || "Other"}
            </span>
            {trip.isPrivate && (
              <span className="text-[11px] tracking-[0.14em] uppercase text-forest bg-forest-mist px-[11px] py-1.5 rounded-full">
                Invite only
              </span>
            )}
          </div>

          <h1 className="font-display text-[46px] leading-[1.04] tracking-[-0.02em] m-0 mb-3">
            {trip.title}
          </h1>

          <p className="m-0 text-[15px] text-muted">
            Organised by{" "}
            <Link to={`/users/${trip.organizer?._id}`} className="text-clay hover:text-clay-deep">
              {trip.organizer?.name}
            </Link>{" "}
            · <RatingBadge rating={trip.organizer?.organizerRating} label="organizer" />
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          {trip.role === "organizer" && (
            <>
              {(trip.status === "open" || trip.status === "locked") && (
                <button
                  disabled={actionLoading}
                  onClick={() =>
                    runAction(() =>
                      updateTripStatus(trip._id, trip.status === "open" ? "locked" : "open")
                    )
                  }
                  className="bg-ink text-canvas rounded-full px-5 py-3 text-sm font-medium hover:bg-clay disabled:opacity-60 transition-colors"
                >
                  {trip.status === "open" ? "Lock trip" : "Reopen trip"}
                </button>
              )}

              {!isFinished && trip.status !== "cancelled" && (
                <>
                  <button
                    disabled={actionLoading}
                    onClick={() => runAction(() => updateTripStatus(trip._id, "completed"))}
                    className="border border-line-bold rounded-full px-5 py-3 text-sm hover:border-ink disabled:opacity-60 transition-colors"
                  >
                    Mark completed
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => runAction(() => updateTripStatus(trip._id, "cancelled"))}
                    className="px-2 py-3 text-sm text-faint hover:text-clay disabled:opacity-60 transition-colors"
                  >
                    Cancel trip
                  </button>
                </>
              )}
            </>
          )}

          {isFinished && trip.role && (
            <Link
              to={`/trip/${trip._id}/recap`}
              className="bg-ink text-canvas rounded-full px-6 py-3 text-sm font-medium hover:bg-clay transition-colors"
            >
              See the recap
            </Link>
          )}

          {trip.role === "participant" && !isFinished && (
            <>
              <span className="inline-flex items-center gap-2 text-sm text-forest bg-forest-mist rounded-full px-5 py-3">
                You're going
              </span>
              <button
                disabled={actionLoading}
                onClick={handleLeave}
                className="px-2 py-3 text-sm text-faint hover:text-clay disabled:opacity-60 transition-colors"
              >
                Leave trip
              </button>
            </>
          )}

          {!trip.role && trip.hasPendingRequest && (
            <span className="inline-flex items-center text-sm text-clay bg-clay/10 rounded-full px-5 py-3">
              Join request pending
            </span>
          )}

          {!trip.role && !trip.hasPendingRequest && trip.status === "open" && (
            <button
              disabled={actionLoading}
              onClick={() => runAction(() => requestJoin(trip._id, invite))}
              className="bg-ink text-canvas rounded-full px-6 py-3 text-sm font-medium hover:bg-clay disabled:opacity-60 transition-colors"
            >
              Request to join
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <p className="mt-5 text-sm text-clay-deep bg-clay/5 border border-clay/20 rounded-xl px-4 py-3">
          {actionError}
        </p>
      )}

      {leaveResult && (
        <p
          className={`mt-5 text-sm rounded-xl px-4 py-3 border ${
            leaveResult.feeOwed
              ? "text-clay-deep bg-clay/5 border-clay/20"
              : "text-forest bg-forest-mist border-forest/20"
          }`}
        >
          {leaveResult.message}
          {leaveResult.feeOwed && (
            <span className="font-medium"> (₪{leaveResult.amountOwed})</span>
          )}
        </p>
      )}

      {/* Facts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-[34px] py-[22px] border-y border-line">
        <Fact label="Dates">{dates}</Fact>
        <Fact label="Meeting point">{trip.meetingLocation || "Not set"}</Fact>
        <Fact label="Participants">
          {trip.members.length}
          {trip.maxCapacity > 0 ? ` of ${trip.maxCapacity}` : ""}
        </Fact>
        <Fact label="Cost per person">
          {finalCost
            ? `₪${finalCost} confirmed`
            : estimate
              ? `₪${estimate} estimated`
              : "Not set"}
        </Fact>
      </div>

      <div className="mt-8">
        <TripTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* ---------- OVERVIEW ---------- */}
      {activeTab === "overview" && (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-10 items-start">
          <div className="flex flex-col gap-11 min-w-0">
            <section>
              <SectionHeading>About this trip</SectionHeading>
              <p className="m-0 text-[17px] leading-[1.65] text-ink-soft max-w-[62ch] text-pretty">
                {trip.description || "No description has been added yet."}
              </p>
            </section>

            <section>
              <SectionHeading>Weather</SectionHeading>
              <p className="m-0 mb-5 text-sm text-faint">
                What it should be doing while you're there.
              </p>
              <TripWeather trip={trip} />
            </section>

            <section>
              <SectionHeading>Lodging plan</SectionHeading>
              {!trip.lodgingPlan?.length ? (
                <p className="text-[15px] text-faint m-0">No lodging plan added.</p>
              ) : (
                <ol className="list-none m-0 p-0">
                  {trip.lodgingPlan.map((night, i) => (
                    <li
                      key={i}
                      className="grid grid-cols-[84px_minmax(0,1fr)] sm:grid-cols-[104px_minmax(0,1fr)] gap-[22px] py-[22px] border-t border-line"
                    >
                      <div>
                        <div className="font-display text-[22px] leading-[1.1]">
                          Night {i + 1}
                        </div>
                        {night.date && (
                          <div className="text-xs text-faint tracking-[0.08em] uppercase mt-1">
                            {shortDate(night.date)}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                          <h3 className="text-base font-semibold m-0">
                            {night.location || "Location to be confirmed"}
                          </h3>
                          <span className="text-[11px] tracking-[0.12em] uppercase text-muted bg-surface-sunk px-2.5 py-[5px] rounded-full">
                            {LODGING_LABELS[night.type] || "Other"}
                          </span>
                        </div>

                        {night.description && (
                          <p className="m-0 mb-2.5 text-[15px] leading-[1.55] text-muted">
                            {night.description}
                          </p>
                        )}

                        {safeUrl(night.bookingUrl) && (
                          <a
                            href={safeUrl(night.bookingUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-clay hover:text-clay-deep text-[15px]"
                          >
                            View the booking ↗
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 flex flex-col gap-[18px] min-w-0">
            {hasCost && (
              <div className="bg-night text-canvas rounded-[18px] p-7">
                <div className="text-[11px] tracking-[0.16em] uppercase text-night-faint mb-4">
                  Cost &amp; payment
                </div>

                <div className="flex items-baseline gap-2.5 mb-1.5">
                  <span className="font-display text-[44px] leading-none">
                    ₪{finalCost ?? estimate}
                  </span>
                  <span className="text-sm text-night-faint">
                    per person{finalCost ? "" : ", estimated"}
                  </span>
                </div>

                <p className="mt-3.5 mb-[22px] text-sm leading-[1.6] text-night-soft">
                  {dueDate ? (
                    <>
                      Cancel before {shortDate(trip.paymentDueDate)} and you owe nothing.
                      After that the fee still stands — the organizer may already have
                      paid for bookings.
                    </>
                  ) : (
                    "Cancelling before the payment date costs nothing. After it, the fee is still owed."
                  )}
                </p>

                <div className="flex flex-col gap-3 pt-5 border-t border-night-line">
                  {!finalCost && trip.finalCostDueDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-night-faint">Price confirmed by</span>
                      <span>{shortDate(trip.finalCostDueDate)}</span>
                    </div>
                  )}
                  {finalCost && estimate && estimate !== finalCost && (
                    <div className="flex justify-between text-sm">
                      <span className="text-night-faint">Originally estimated</span>
                      <span>₪{estimate}</span>
                    </div>
                  )}
                  {dueDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-night-faint">Payment due</span>
                      <span className={duePassed ? "text-clay" : ""}>
                        {shortDate(trip.paymentDueDate)}
                      </span>
                    </div>
                  )}
                </div>

                {trip.role === "participant" && !isFinished && finalCost && (
                  <>
                    <a
                      href={payNowHref()}
                      className="block text-center w-full mt-5 bg-canvas text-ink rounded-full px-5 py-3.5 text-[15px] font-medium hover:bg-clay hover:text-canvas transition-colors"
                    >
                      Pay now
                    </a>
                    <p className="mt-2.5 mb-0 text-xs text-night-faint text-center">
                      Opens your email app. TripShare doesn't process payments.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Only the organizer gets the token, so only they see this */}
            {trip.inviteToken && (
              <div className="bg-surface border border-line rounded-[18px] p-[26px]">
                <div className="text-[11px] tracking-[0.16em] uppercase text-faint mb-3.5">
                  Invite link
                </div>
                <p className="m-0 mb-4 text-sm leading-[1.55] text-muted">
                  This trip is hidden from browse. Share this link and whoever has it can
                  see the trip and ask to join.
                </p>

                <div className="text-xs text-muted bg-canvas border border-line rounded-[10px] px-3 py-2.5 break-all mb-3">
                  {`${window.location.origin}/trip/${trip._id}?invite=${trip.inviteToken}`}
                </div>

                <button
                  onClick={async () => {
                    const link = `${window.location.origin}/trip/${trip._id}?invite=${trip.inviteToken}`;
                    try {
                      await navigator.clipboard.writeText(link);
                      setInviteCopied(true);
                      setTimeout(() => setInviteCopied(false), 2000);
                    } catch {
                      // Clipboard can be blocked; the link is on screen to copy by hand.
                      setInviteCopied(false);
                    }
                  }}
                  className="w-full border border-line-bold rounded-full px-4 py-2.5 text-sm hover:border-ink transition-colors"
                >
                  {inviteCopied ? "Copied" : "Copy invite link"}
                </button>
              </div>
            )}

            <div className="bg-surface border border-line rounded-[18px] p-[26px]">
              <div className="text-[11px] tracking-[0.16em] uppercase text-faint mb-3.5">
                Who's in
              </div>

              <div className="flex flex-col gap-3.5">
                <Link
                  to={`/users/${trip.organizer?._id}`}
                  className="flex items-center gap-3 group"
                >
                  <Avatar name={trip.organizer?.name} tone="forest" />
                  <div>
                    <div className="text-sm font-medium group-hover:text-clay transition-colors">
                      {trip.organizer?.name}
                    </div>
                    <div className="text-xs text-faint">Organizer</div>
                  </div>
                </Link>

                {trip.members.map((m) => (
                  <Link
                    key={m._id}
                    to={`/users/${m._id}`}
                    className="flex items-center gap-3 group"
                  >
                    <Avatar name={m.name} tone="clay" />
                    <div>
                      <div className="text-sm font-medium group-hover:text-clay transition-colors">
                        {m.name}
                      </div>
                      <div className="text-xs text-faint">
                        <RatingBadge rating={m.participantRating} label="participant" />
                      </div>
                    </div>
                  </Link>
                ))}

                {trip.members.length === 0 && (
                  <p className="text-sm text-faint m-0">No participants yet.</p>
                )}
              </div>

              {trip.role === "organizer" && pendingCount > 0 && (
                <button
                  onClick={() => setActiveTab("people")}
                  className="w-full mt-5 border border-line-bold rounded-full px-4 py-2.5 text-sm hover:border-ink transition-colors"
                >
                  {pendingCount} request{pendingCount === 1 ? "" : "s"} waiting
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* ---------- PROPOSALS ---------- */}
      {activeTab === "proposals" && (
        <section className="max-w-[760px]">
          <SectionHeading>Proposed changes</SectionHeading>
          <p className="m-0 mb-7 text-sm text-faint">
            {trip.role === "organizer"
              ? "Ask the group before changing anything they already agreed to. Anyone who doesn't vote counts as agreeing, and you break a tie."
              : "Changes the organizer wants to make. Not voting counts as agreeing, so speak up if you disagree."}
          </p>
          <ProposedChanges trip={trip} onApplied={loadTrip} />
        </section>
      )}

      {/* ---------- ROUTE ---------- */}
      {activeTab === "route" && (
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <section className="min-w-0">
            <SectionHeading>Travel plan</SectionHeading>
            <p className="m-0 mb-[26px] text-sm text-faint">
              Tap a stop to find it on the map.
            </p>

            {!trip.travelPlan?.length ? (
              <p className="text-[15px] text-faint">No travel plan added.</p>
            ) : (
              <ol className="list-none m-0 p-0">
                {trip.travelPlan.map((step, i) => {
                  const pinned = typeof step.lat === "number";
                  const isActive = activeStep === i;
                  const isLast = i === trip.travelPlan.length - 1;

                  return (
                    <li key={i} className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveStep(isActive ? null : i)}
                        className="w-full text-left grid grid-cols-[44px_minmax(0,1fr)] gap-[18px] pb-8"
                      >
                        <span
                          className={`w-[34px] h-[34px] rounded-full grid place-items-center text-[13px] relative z-10 border transition-colors ${
                            isActive
                              ? "bg-ink text-canvas border-ink"
                              : "bg-canvas text-ink border-ink"
                          }`}
                        >
                          {i + 1}
                        </span>

                        <span className="block pt-1">
                          <span className="block text-[17px] font-semibold mb-1">
                            {TRAVEL_LABELS[step.mode] || "Other"}
                          </span>
                          {step.location && (
                            <span className="block text-[13px] tracking-[0.08em] uppercase text-clay mb-2.5">
                              {step.location}
                            </span>
                          )}
                          {step.description && (
                            <span className="block text-[15px] leading-[1.6] text-muted max-w-[44ch]">
                              {step.description}
                            </span>
                          )}
                          {!pinned && (
                            <span className="block text-xs text-faint mt-2">
                              Not placed on the map
                            </span>
                          )}
                        </span>
                      </button>

                      {!isLast && (
                        <span className="absolute left-[17px] top-[34px] bottom-0 w-px bg-line-strong" />
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <div className="min-w-0">
            <TripMap
              steps={trip.travelPlan || []}
              activeIndex={activeStep}
              onMarkerClick={(i) => setActiveStep(i)}
              height={420}
            />
          </div>
        </div>
      )}

      {/* ---------- CHAT ---------- */}
      {activeTab === "chat" && (
        <section className="max-w-[760px]">
          {trip.role ? (
            <>
              <SectionHeading>Trip chat</SectionHeading>
              <p className="m-0 mb-7 text-sm text-faint">
                Everyone on this trip is in this conversation.
              </p>
              <ChatThread
                loadMessages={() => getTripMessages(trip._id)}
                sendMessage={(text) => sendTripMessage(trip._id, text)}
                height={380}
              />
            </>
          ) : (
            <>
              <SectionHeading>Chat with the organizer</SectionHeading>
              <p className="m-0 mb-7 text-sm text-faint">
                Private conversation about your join request.
              </p>
              <ChatThread
                loadMessages={() => getJoinRequestMessages(trip.myJoinRequestId)}
                sendMessage={(text) => sendJoinRequestMessage(trip.myJoinRequestId, text)}
                emptyLabel="No messages yet. Introduce yourself to the organizer."
                height={380}
              />
            </>
          )}
        </section>
      )}

      {/* ---------- PEOPLE ---------- */}
      {activeTab === "people" && (
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {trip.role === "organizer" && (
            <section className="min-w-0">
              <SectionHeading>Join requests</SectionHeading>
              <p className="m-0 mb-[22px] text-sm text-faint">
                {pendingCount === 0
                  ? "Nobody is waiting on you."
                  : `${pendingCount} ${pendingCount === 1 ? "person is" : "people are"} waiting on you.`}
              </p>

              <div className="flex flex-col gap-4">
                {trip.joinRequests?.map((r) => (
                  <article
                    key={r._id}
                    className="bg-surface border border-line rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3.5 mb-[18px]">
                      <Avatar name={r.requester?.name} tone="forest" size={44} />
                      <div>
                        <Link
                          to={`/users/${r.requester?._id}`}
                          className="text-[17px] font-semibold text-ink hover:text-clay transition-colors"
                        >
                          {r.requester?.name}
                        </Link>
                        <div className="text-[13px] text-muted">
                          <RatingBadge
                            rating={r.requester?.participantRating}
                            label="participant"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5 items-center">
                      <button
                        disabled={actionLoading}
                        onClick={() => runAction(() => decideJoinRequest(r._id, "approved"))}
                        className="bg-forest text-canvas rounded-full px-[22px] py-2.5 text-sm font-medium hover:bg-forest-deep disabled:opacity-60 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => runAction(() => decideJoinRequest(r._id, "rejected"))}
                        className="border border-line-bold rounded-full px-5 py-2.5 text-sm hover:border-ink disabled:opacity-60 transition-colors"
                      >
                        Reject
                      </button>
                    </div>

                    <details className="mt-4">
                      <summary className="text-sm text-clay cursor-pointer hover:text-clay-deep">
                        Chat with {r.requester?.name}
                      </summary>
                      <div className="mt-3">
                        <ChatThread
                          loadMessages={() => getJoinRequestMessages(r._id)}
                          sendMessage={(text) => sendJoinRequestMessage(r._id, text)}
                          emptyLabel="No messages yet. Ask them anything before deciding."
                          height={200}
                        />
                      </div>
                    </details>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="min-w-0">
            <SectionHeading>Participants</SectionHeading>
            <p className="m-0 mb-2 text-sm text-faint">
              Tap anyone to see their trips and reviews.
            </p>

            <ul className="list-none m-0 p-0">
              <li>
                <Link
                  to={`/users/${trip.organizer?._id}`}
                  className="w-full flex items-center gap-3.5 border-t border-line py-[18px] px-1 hover:bg-surface transition-colors"
                >
                  <Avatar name={trip.organizer?.name} tone="forest" size={38} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-base font-medium">
                      {trip.organizer?.name}
                    </span>
                    <span className="block text-[13px] text-faint mt-0.5">
                      Organizer ·{" "}
                      <RatingBadge
                        rating={trip.organizer?.organizerRating}
                        label="organizer"
                      />
                    </span>
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A9A296" strokeWidth="1.8">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </Link>
              </li>

              {trip.members.map((m) => (
                <li key={m._id}>
                  <Link
                    to={`/users/${m._id}`}
                    className="w-full flex items-center gap-3.5 border-t border-line py-[18px] px-1 hover:bg-surface transition-colors"
                  >
                    <Avatar name={m.name} tone="sand" size={38} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-base font-medium">{m.name}</span>
                      <span className="block text-[13px] text-faint mt-0.5">
                        <RatingBadge rating={m.participantRating} label="participant" />
                      </span>
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A9A296" strokeWidth="1.8">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>

            {trip.members.length === 0 && (
              <p className="text-[15px] text-faint border-t border-line pt-[18px]">
                No participants yet.
              </p>
            )}
          </section>
        </div>
      )}

      {/* ---------- REVIEWS ---------- */}
      {activeTab === "reviews" && (
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <section className="min-w-0">
            <SectionHeading>Rate your trip-mates</SectionHeading>
            {peopleToReview.length === 0 ? (
              <p className="text-[15px] text-faint">
                You've rated everyone you can for this trip.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {peopleToReview.map((person) => (
                  <ReviewForm
                    key={person._id}
                    personName={person.name}
                    disabled={actionLoading}
                    onSubmit={(data) =>
                      runAction(() =>
                        createReview(trip._id, { reviewee: person._id, ...data })
                      )
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section className="min-w-0">
            <SectionHeading>What people said</SectionHeading>
            {reviews.length === 0 ? (
              <div className="border border-dashed border-line-strong rounded-2xl px-[26px] py-[34px] text-center">
                <p className="m-0 mb-1.5 text-base text-muted">No reviews yet.</p>
                <p className="m-0 text-sm text-faint">
                  They appear as people rate each other.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {reviews.map((r) => (
                  <article
                    key={r._id}
                    className="bg-surface border border-line rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-[15px] font-medium">{r.reviewer?.name}</span>
                      <span className="text-clay text-sm">{"★".repeat(r.score)}</span>
                    </div>
                    <div className="text-xs text-faint mb-2">
                      on {r.reviewee?.name} ·{" "}
                      {r.direction === "participant_to_organizer"
                        ? "as organizer"
                        : "as participant"}
                    </div>
                    {r.comment && (
                      <p className="m-0 text-[15px] leading-[1.6] text-muted">
                        {r.comment}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
