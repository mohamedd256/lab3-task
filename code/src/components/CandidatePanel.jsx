import { useEffect, useState } from "react";
import { gatherCandidates } from "../lib/gatherCandidates";

// Defined outside the component so every array keeps the same identity
// between renders (otherwise the effect would restart on every render).
const CONFIGS = {
  none: [],
  stun: [{ urls: "stun:stun.l.google.com:19302" }],
  wrong: [{ urls: "stun:stun.invalid.example:3478" }],
};

const ROW_COLOURS = {
  host: "#dff3e3",  // green
  srflx: "#dce9fb", // blue
};

const cell = { padding: "6px 12px", textAlign: "left", borderBottom: "1px solid #ccc" };

export default function CandidatePanel() {
  const [configName, setConfigName] = useState("stun");
  const [candidates, setCandidates] = useState([]);
  const [gatheringState, setGatheringState] = useState("new");
  const [elapsedMs, setElapsedMs] = useState(null);

  const iceServers = CONFIGS[configName];

  useEffect(() => {
    // fresh run: empty the table, reset state and timer
    setCandidates([]);
    setElapsedMs(null);
    setGatheringState("new");

    const startedAt = performance.now();

    const stop = gatherCandidates({
      iceServers,
      onCandidate: (candidate) => setCandidates((prev) => [...prev, candidate]),
      onDone: () => setElapsedMs(Math.round(performance.now() - startedAt)),
      onStateChange: setGatheringState,
    });

    // cleanup: closes the old connection before the next run / on unmount
    return stop;
  }, [iceServers]);

  // sort a copy (sort() would mutate state), highest priority first
  const rows = [...candidates].sort((a, b) => b.priority - a.priority);

  return (
    <section style={{ fontFamily: "system-ui, sans-serif", padding: 16, maxWidth: 900 }}>
      <h2>ICE candidate panel</h2>

      <label>
        Configuration:{" "}
        <select value={configName} onChange={(e) => setConfigName(e.target.value)}>
          {Object.keys(CONFIGS).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <p>
        Gathering state: <strong>{gatheringState}</strong>
        {" · "}
        Gathering time:{" "}
        <strong>{elapsedMs === null ? "…" : `${elapsedMs} ms`}</strong>
        {" · "}
        Candidates: <strong>{candidates.length}</strong>
      </p>

      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr style={{ background: "#eee" }}>
            <th style={cell}>Type</th>
            <th style={cell}>Protocol</th>
            <th style={cell}>Address : port</th>
            <th style={cell}>Priority</th>
            <th style={cell}>Foundation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.candidate} style={{ background: ROW_COLOURS[c.type] ?? "#fff" }}>
              <td style={cell}>{c.type}</td>
              <td style={cell}>{c.protocol}</td>
              <td style={cell}>
                {c.address}:{c.port}
              </td>
              <td style={cell}>{c.priority}</td>
              <td style={cell}>{c.foundation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
