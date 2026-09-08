import { useEffect, useState } from "react";
import { hasPoint } from "../lib/mapUtils";

// Open-Meteo's WMO codes, grouped into something worth reading.
const CONDITIONS = {
  0: { label: "Clear", icon: "☀︎" },
  1: { label: "Mostly clear", icon: "☀︎" },
  2: { label: "Partly cloudy", icon: "⛅︎" },
  3: { label: "Overcast", icon: "☁︎" },
  45: { label: "Fog", icon: "☁︎" },
  48: { label: "Freezing fog", icon: "☁︎" },
  51: { label: "Light drizzle", icon: "☂︎" },
  53: { label: "Drizzle", icon: "☂︎" },
  55: { label: "Heavy drizzle", icon: "☂︎" },
  61: { label: "Light rain", icon: "☂︎" },
  63: { label: "Rain", icon: "☂︎" },
  65: { label: "Heavy rain", icon: "☂︎" },
  71: { label: "Light snow", icon: "❄︎" },
  73: { label: "Snow", icon: "❄︎" },
  75: { label: "Heavy snow", icon: "❄︎" },
  80: { label: "Showers", icon: "☂︎" },
  81: { label: "Showers", icon: "☂︎" },
  82: { label: "Heavy showers", icon: "☂︎" },
  95: { label: "Thunderstorm", icon: "⚡︎" },
  96: { label: "Thunderstorm", icon: "⚡︎" },
  99: { label: "Thunderstorm", icon: "⚡︎" },
};

function isoDate(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function dayLabel(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Live forecast, fetched straight from the weather service and never
// stored - so it can't go stale in our own data.
export default function TripWeather({ trip }) {
  const [days, setDays] = useState(null);
  const [state, setState] = useState("loading");

  // Weather needs coordinates; the first pinned travel stop provides them.
  const point = (trip.travelPlan || []).find(hasPoint);

  useEffect(() => {
    if (!point || !trip.startDate) {
      setState("unavailable");
      return;
    }

    const start = new Date(trip.startDate);
    const end = trip.endDate ? new Date(trip.endDate) : start;

    // The service only forecasts about a fortnight ahead.
    const daysAway = (start.getTime() - Date.now()) / 86400000;
    if (daysAway > 15) {
      setState("too-far");
      return;
    }
    if (end.getTime() < Date.now() - 86400000) {
      setState("past");
      return;
    }

    const controller = new AbortController();
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${point.lat}&longitude=${point.lng}` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto` +
      `&start_date=${isoDate(start)}&end_date=${isoDate(end)}`;

    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data) => {
        const d = data.daily;
        if (!d?.time?.length) {
          setState("unavailable");
          return;
        }
        setDays(
          d.time.map((t, i) => ({
            date: t,
            code: d.weather_code[i],
            max: Math.round(d.temperature_2m_max[i]),
            min: Math.round(d.temperature_2m_min[i]),
          }))
        );
        setState("ready");
      })
      .catch((err) => {
        if (err.name !== "AbortError") setState("error");
      });

    return () => controller.abort();
  }, [trip._id, trip.startDate, trip.endDate, point?.lat, point?.lng]);

  if (state === "unavailable" && !point) {
    return (
      <p className="text-[15px] text-faint m-0">
        Pin a travel stop on the map and the forecast for those dates appears here.
      </p>
    );
  }

  if (state === "too-far") {
    return (
      <p className="text-[15px] text-faint m-0">
        The forecast arrives about two weeks before you leave.
      </p>
    );
  }

  if (state === "past") {
    return <p className="text-[15px] text-faint m-0">This trip has already happened.</p>;
  }

  if (state === "error" || state === "unavailable") {
    return (
      <p className="text-[15px] text-faint m-0">
        Couldn't reach the weather service just now.
      </p>
    );
  }

  if (state === "loading") {
    return (
      <div className="flex gap-3">
        <div className="animate-pulse bg-line h-[104px] w-[120px] rounded-[14px]" />
        <div className="animate-pulse bg-line h-[104px] w-[120px] rounded-[14px]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-3 flex-wrap">
        {days.map((d) => {
          const condition = CONDITIONS[d.code] || { label: "—", icon: "·" };

          return (
            <div
              key={d.date}
              className="bg-surface border border-line rounded-[14px] px-4 py-3.5 min-w-[120px]"
            >
              <div className="text-[11px] tracking-[0.1em] uppercase text-faint mb-2">
                {dayLabel(d.date)}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl leading-none text-clay">{condition.icon}</span>
                <span className="font-display text-[24px] leading-none">{d.max}°</span>
                <span className="text-[13px] text-faint">{d.min}°</span>
              </div>
              <div className="text-[13px] text-muted mt-1.5">{condition.label}</div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-faint mt-3 mb-0">
        Live forecast for {point.location || "the first stop"} · Open-Meteo
      </p>
    </div>
  );
}
