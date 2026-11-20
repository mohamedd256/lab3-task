// Plain JavaScript helper (no React). Opens a throw-away RTCPeerConnection,
// lets the browser gather ICE candidates and reports them through callbacks.
//
// Returns a function that closes the connection (used as the effect cleanup).
export function gatherCandidates({ iceServers, onCandidate, onDone, onStateChange }) {
  let closed = false;

  const connection = new RTCPeerConnection({ iceServers });

  // A data channel makes the offer contain an m= section, which is what
  // triggers ICE gathering when the local description is set.
  connection.createDataChannel("probe");

  connection.addEventListener("icegatheringstatechange", () => {
    if (closed) return;
    if (onStateChange) onStateChange(connection.iceGatheringState);
  });

  connection.addEventListener("icecandidate", (event) => {
    if (closed) return;
    if (event.candidate) {
      onCandidate(event.candidate);
    } else {
      // null candidate = end of gathering
      onDone();
    }
  });

  connection
    .createOffer()
    .then((offer) => connection.setLocalDescription(offer))
    .catch((err) => {
      // closing the connection while the offer is pending is expected
      if (!closed) console.error("ICE gathering failed:", err);
    });

  return function stop() {
    closed = true;
    connection.close();
  };
}
