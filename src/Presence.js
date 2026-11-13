import { useEffect, useState } from "react";
import PartySocket from "partysocket";

// Live cursors of other people reading the portfolio right now.
// Set REACT_APP_PARTYKIT_HOST (e.g. samuel-portfolio-cursors.<you>.partykit.dev) to turn it on.
const HOST = process.env.REACT_APP_PARTYKIT_HOST;

let regionNames;
try { regionNames = new Intl.DisplayNames(["en"], { type: "region" }); } catch { regionNames = null; }
const place = (code) => {
  if (!code) return "Someone";
  try { return `Someone in ${regionNames ? regionNames.of(code) : code}`; } catch { return "Someone"; }
};

const COLORS = ["#c98a4b", "#7fb3c4", "#d8c167", "#93bf8c", "#e0866a", "#e8ece4"];
const colorFor = (id) => COLORS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

export function usePresence() {
  const [cursors, setCursors] = useState({});
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!HOST) return;
    const socket = new PartySocket({ host: HOST, room: "portfolio" });

    socket.addEventListener("message", (e) => {
      let msg; try { msg = JSON.parse(e.data); } catch { return; }
      if (msg.type === "sync") { setCursors(msg.cursors || {}); setCount(msg.count || 0); }
      if (msg.type === "count") setCount(msg.count);
      if (msg.type === "update") setCursors((c) => ({ ...c, [msg.id]: { x: msg.x, y: msg.y, country: msg.country } }));
      if (msg.type === "remove") {
        setCursors((c) => { const n = { ...c }; delete n[msg.id]; return n; });
        if (msg.count != null) setCount(msg.count);
      }
    });

    // Positions are shared as fractions of the page, so they line up on any screen size
    let last = 0;
    const onMove = (e) => {
      const now = performance.now();
      if (now - last < 45) return; last = now;
      const docH = document.documentElement.scrollHeight;
      socket.send(JSON.stringify({ x: e.clientX / window.innerWidth, y: (e.clientY + window.scrollY) / docH }));
    };
    if (window.matchMedia("(pointer: fine)").matches) window.addEventListener("pointermove", onMove, { passive: true });

    return () => { window.removeEventListener("pointermove", onMove); socket.close(); };
  }, []);

  return { enabled: !!HOST, cursors, others: Math.max(0, count - 1) };
}

export function PresenceLayer({ cursors }) {
  const docH = typeof document !== "undefined" ? document.documentElement.scrollHeight : 0;
  return (
    <div className="presence" style={{ height: docH }} aria-hidden="true">
      {Object.entries(cursors).map(([id, c]) => (
        c.x >= 0 && (
          <div key={id} className="presence__cursor" style={{ left: `${c.x * 100}%`, top: c.y * docH, "--c": colorFor(id) }}>
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M1 1l5.5 13 2-5.5L14 6.5z" fill="var(--c)" stroke="#0c2b22" strokeWidth="1" /></svg>
            <span>{place(c.country)}</span>
          </div>
        )
      ))}
    </div>
  );
}
