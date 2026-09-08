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

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString();
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

function Card({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow space-y-3">
      {title && (
        <div>
          <h3 className="font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
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

  const loadTrip = async () => {
    const res = await getTrip(id);
    setTrip(res.data);

    if (res.data.status === "completed") {
      const reviewRes = await getTripReviews(id);
      setReviews(reviewRes.data);
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
    { key: "overview", label: "Overview", icon: "📋" },
    { key: "route", label: "Route", icon: "🗺️" },
    ...(canChat ? [{ key: "chat", label: "Chat", icon: "💬" }] : []),
    { key: "people", label: "People", icon: "👥", badge: pendingCount },
    ...(isFinished && trip.role ? [{ key: "reviews", label: "Reviews", icon: "⭐" }] : []),
  ];

  const requested = searchParams.get("tab");
  const activeTab = tabs.some((t) => t.key === requested) ? requested : "overview";

  const setActiveTab = (key) => {
    searchParams.set("tab", key);
    setSearchParams(searchParams, { replace: true });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header - stays visible whichever tab you're on */}
      <div className="bg-white rounded-2xl p-6 shadow space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">{trip.title}</h2>
            <p className="text-gray-500">
              {trip.meetingLocation || "No meeting location set"}
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
            {trip.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <span>Type: {TYPE_LABELS[trip.type] || "Other"}</span>
          {trip.startDate && <span>From: {formatDate(trip.startDate)}</span>}
          {trip.endDate && <span>To: {formatDate(trip.endDate)}</span>}
          {trip.maxCapacity > 0 && (
            <span>
              Participants: {trip.members.length}/{trip.maxCapacity}
            </span>
          )}
        </div>

        <div className="text-sm text-gray-500">
          Organized by {trip.organizer?.name}{" "}
          <RatingBadge rating={trip.organizer?.organizerRating} label="organizer" />
        </div>

        {actionError && <p className="text-red-600 text-sm">{actionError}</p>}

        {/* Viewer actions */}
        <div className="pt-2 flex flex-wrap gap-2">
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
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-60"
                >
                  {trip.status === "open" ? "Lock Trip" : "Reopen Trip"}
                </button>
              )}

              {!isFinished && trip.status !== "cancelled" && (
                <>
                  <button
                    disabled={actionLoading}
                    onClick={() => runAction(() => updateTripStatus(trip._id, "completed"))}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60"
                  >
                    Mark as Completed
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => runAction(() => updateTripStatus(trip._id, "cancelled"))}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60"
                  >
                    Cancel Trip
                  </button>
                </>
              )}
            </>
          )}

          {trip.role === "participant" && !isFinished && (
            <>
              <span className="inline-block bg-purple-100 text-purple-700 font-semibold px-4 py-2 rounded-lg">
                You're going on this trip
              </span>
              <button
                disabled={actionLoading}
                onClick={handleLeave}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-60"
              >
                Leave Trip
              </button>
            </>
          )}

          {!trip.role && trip.hasPendingRequest && (
            <span className="inline-block bg-orange-100 text-orange-700 font-semibold px-4 py-2 rounded-lg">
              Join request pending
            </span>
          )}

          {!trip.role && !trip.hasPendingRequest && trip.status === "open" && (
            <button
              disabled={actionLoading}
              onClick={() => runAction(() => requestJoin(trip._id))}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              Request to Join
            </button>
          )}
        </div>
      </div>

      {leaveResult && (
        <div
          className={`rounded-2xl p-4 text-sm ${
            leaveResult.feeOwed
              ? "bg-orange-50 text-orange-800 ring-1 ring-orange-200"
              : "bg-green-50 text-green-800 ring-1 ring-green-200"
          }`}
        >
          {leaveResult.message}
          {leaveResult.feeOwed && (
            <span className="font-semibold"> (₪{leaveResult.amountOwed})</span>
          )}
        </div>
      )}

      <TripTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* ---------- OVERVIEW ---------- */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {trip.description && (
            <Card title="About this trip">
              <p className="text-gray-700">{trip.description}</p>
            </Card>
          )}

          {trip.role && (
            <Card
              title="Proposed Changes"
              subtitle="Changes the organizer wants to make to this trip, and where the group stands on them."
            >
              <ProposedChanges trip={trip} onApplied={loadTrip} />
            </Card>
          )}

          {hasCost && (
            <Card title="Cost & Payment">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  ₪{finalCost ?? estimate}
                </span>
                <span className="text-sm text-gray-500">
                  per person {finalCost ? "(confirmed)" : "(estimated)"}
                </span>
              </div>

              {!finalCost && (
                <p className="text-sm text-gray-600">
                  This is an estimate.{" "}
                  {trip.finalCostDueDate ? (
                    <>
                      The organizer confirms the exact price by{" "}
                      <span className="font-semibold">
                        {formatDate(trip.finalCostDueDate)}
                      </span>
                      .
                    </>
                  ) : (
                    "The organizer will confirm the exact price closer to the trip."
                  )}
                </p>
              )}

              {finalCost && estimate && estimate !== finalCost && (
                <p className="text-xs text-gray-400">
                  Originally estimated at ₪{estimate}.
                </p>
              )}

              {dueDate && (
                <p className="text-sm text-gray-600">
                  Payment due by{" "}
                  <span className="font-semibold">{formatDate(trip.paymentDueDate)}</span>
                  {duePassed && (
                    <span className="text-orange-600"> — the due date has passed</span>
                  )}
                </p>
              )}

              <p className="text-xs text-gray-500">
                Cancelling before the due date costs nothing. On or after it, the fee is
                still owed, since the organizer may already have paid for bookings.
              </p>

              {trip.role === "participant" && !isFinished && finalCost && (
                <div>
                  <a
                    href={payNowHref()}
                    className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Pay Now
                  </a>
                  <p className="text-xs text-gray-400 mt-2">
                    Opens your email app with a message to the organizer. TripShare
                    doesn't process payments itself.
                  </p>
                </div>
              )}
            </Card>
          )}

          <Card title="Lodging Plan">
            {!trip.lodgingPlan?.length ? (
              <p className="text-sm text-gray-400">No lodging plan added.</p>
            ) : (
              <div className="space-y-2">
                {trip.lodgingPlan.map((night, i) => (
                  <div key={i} className="border rounded-lg p-3 text-sm">
                    <div className="font-semibold">
                      {formatDate(night.date) || `Night ${i + 1}`} —{" "}
                      {LODGING_LABELS[night.type] || "Other"}
                    </div>
                    {night.location && (
                      <div className="text-gray-500">{night.location}</div>
                    )}
                    {night.description && (
                      <div className="text-gray-500">{night.description}</div>
                    )}
                    {safeUrl(night.bookingUrl) && (
                      <a
                        href={safeUrl(night.bookingUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-1 text-blue-600 font-semibold hover:underline"
                      >
                        View the booking ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ---------- ROUTE ---------- */}
      {activeTab === "route" && (
        <Card title="Travel Plan" subtitle="Tap a stop to find it on the map.">
          {!trip.travelPlan?.length ? (
            <p className="text-sm text-gray-400">No travel plan added.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                {trip.travelPlan.map((step, i) => {
                  const pinned = typeof step.lat === "number";
                  const isActive = activeStep === i;

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveStep(isActive ? null : i)}
                      className={`w-full text-left border rounded-lg p-3 text-sm transition ${
                        isActive ? "border-blue-500 bg-blue-50" : "hover:border-gray-400"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 shrink-0 rounded-full text-white text-xs font-bold flex items-center justify-center ${
                            isActive ? "bg-blue-600" : "bg-slate-500"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="font-semibold">
                          {TRAVEL_LABELS[step.mode] || "Other"}
                        </span>
                        {!pinned && (
                          <span className="text-xs text-gray-400 ml-auto">not on map</span>
                        )}
                      </div>

                      {step.location && (
                        <div className="text-gray-500 mt-1">{step.location}</div>
                      )}
                      {step.description && (
                        <div className="text-gray-500">{step.description}</div>
                      )}
                    </button>
                  );
                })}
              </div>

              <TripMap
                steps={trip.travelPlan}
                activeIndex={activeStep}
                onMarkerClick={(i) => setActiveStep(i)}
                height={420}
              />
            </div>
          )}
        </Card>
      )}

      {/* ---------- CHAT ---------- */}
      {activeTab === "chat" && (
        <div className="space-y-6">
          {trip.role && (
            <Card
              title="Trip Chat"
              subtitle="Everyone on this trip is in this conversation."
            >
              <ChatThread
                loadMessages={() => getTripMessages(trip._id)}
                sendMessage={(text) => sendTripMessage(trip._id, text)}
                height={340}
              />
            </Card>
          )}

          {!trip.role && trip.myJoinRequestId && (
            <Card
              title="Chat with the organizer"
              subtitle="Private conversation about your join request."
            >
              <ChatThread
                loadMessages={() => getJoinRequestMessages(trip.myJoinRequestId)}
                sendMessage={(text) =>
                  sendJoinRequestMessage(trip.myJoinRequestId, text)
                }
                emptyLabel="No messages yet. Introduce yourself to the organizer."
                height={340}
              />
            </Card>
          )}
        </div>
      )}

      {/* ---------- PEOPLE ---------- */}
      {activeTab === "people" && (
        <div className="space-y-6">
          {trip.role === "organizer" && trip.joinRequests && (
            <Card title="Join Requests">
              {trip.joinRequests.length === 0 ? (
                <p className="text-sm text-gray-400">No pending requests.</p>
              ) : (
                trip.joinRequests.map((r) => (
                  <div key={r._id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link
                          to={`/users/${r.requester?._id}`}
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          {r.requester?.name}
                        </Link>
                        <div>
                          <RatingBadge
                            rating={r.requester?.participantRating}
                            label="participant"
                          />
                        </div>
                      </div>
                      <div className="space-x-2">
                        <button
                          disabled={actionLoading}
                          onClick={() =>
                            runAction(() => decideJoinRequest(r._id, "approved"))
                          }
                          className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() =>
                            runAction(() => decideJoinRequest(r._id, "rejected"))
                          }
                          className="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm hover:bg-gray-300 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    </div>

                    <details>
                      <summary className="text-sm text-blue-600 cursor-pointer">
                        Chat with {r.requester?.name}
                      </summary>
                      <div className="mt-2">
                        <ChatThread
                          loadMessages={() => getJoinRequestMessages(r._id)}
                          sendMessage={(text) => sendJoinRequestMessage(r._id, text)}
                          emptyLabel="No messages yet. Ask them anything before deciding."
                          height={180}
                        />
                      </div>
                    </details>
                  </div>
                ))
              )}
            </Card>
          )}

          <Card title="Participants" subtitle="Tap anyone to see their trips and reviews.">
            <Link
              to={`/users/${trip.organizer?._id}`}
              className="flex items-center justify-between border rounded-lg p-3 hover:border-gray-400 transition"
            >
              <div>
                <span className="font-semibold text-sm">{trip.organizer?.name}</span>
                <span className="text-xs text-gray-400"> · organizer</span>
                <div>
                  <RatingBadge
                    rating={trip.organizer?.organizerRating}
                    label="organizer"
                  />
                </div>
              </div>
              <span className="text-gray-300">›</span>
            </Link>

            {trip.members.length === 0 ? (
              <p className="text-sm text-gray-400">No participants yet.</p>
            ) : (
              <div className="space-y-2">
                {trip.members.map((m) => (
                  <Link
                    key={m._id}
                    to={`/users/${m._id}`}
                    className="flex items-center justify-between border rounded-lg p-3 hover:border-gray-400 transition"
                  >
                    <div>
                      <span className="font-semibold text-sm">{m.name}</span>
                      <div>
                        <RatingBadge
                          rating={m.participantRating}
                          label="participant"
                        />
                      </div>
                    </div>
                    <span className="text-gray-300">›</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ---------- REVIEWS ---------- */}
      {activeTab === "reviews" && (
        <div className="space-y-6">
          <Card title="Rate your trip-mates">
            {peopleToReview.length === 0 ? (
              <p className="text-sm text-gray-400">
                You've rated everyone you can for this trip.
              </p>
            ) : (
              peopleToReview.map((person) => (
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
              ))
            )}
          </Card>

          {reviews.length > 0 && (
            <Card title="Reviews from this trip">
              {reviews.map((r) => (
                <div key={r._id} className="border rounded-lg p-3 text-sm">
                  <div className="font-semibold">
                    {r.reviewer?.name} → {r.reviewee?.name} · {"⭐".repeat(r.score)}
                  </div>
                  {r.comment && <div className="text-gray-500">{r.comment}</div>}
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
