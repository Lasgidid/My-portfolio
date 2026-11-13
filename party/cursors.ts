import type * as Party from "partykit/server";

// Shares each visitor's cursor with everyone else on the portfolio.
// Deploy with: npx partykit deploy
type Cursor = { x: number; y: number; country?: string };

export default class Cursors implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection<Cursor>, ctx: Party.ConnectionContext) {
    const country = (ctx.request.cf?.country as string | undefined) || undefined;
    conn.setState({ x: -1, y: -1, country });

    const others: Record<string, Cursor> = {};
    for (const c of this.room.getConnections<Cursor>()) {
      if (c.id !== conn.id && c.state && c.state.x >= 0) others[c.id] = c.state;
    }
    conn.send(JSON.stringify({ type: "sync", cursors: others, count: [...this.room.getConnections()].length }));
    this.room.broadcast(JSON.stringify({ type: "count", count: [...this.room.getConnections()].length }), [conn.id]);
  }

  onMessage(message: string, sender: Party.Connection<Cursor>) {
    let data: { x?: unknown; y?: unknown };
    try { data = JSON.parse(message); } catch { return; }
    const x = Number(data.x), y = Number(data.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const state = { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)), country: sender.state?.country };
    sender.setState(state);
    this.room.broadcast(JSON.stringify({ type: "update", id: sender.id, ...state }), [sender.id]);
  }

  onClose(conn: Party.Connection) {
    this.room.broadcast(JSON.stringify({ type: "remove", id: conn.id, count: [...this.room.getConnections()].length }));
  }
}
