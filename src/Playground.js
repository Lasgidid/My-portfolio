import React, { useMemo, useRef, useState } from "react";

// A browser-only copy of the blog-mvc-hbs API: same routes, controller functions and model rules.
const NODES = [
  { name: "Your browser", file: "fetch()" },
  { name: "Middleware", file: "src/app.js" },
  { name: "Router", file: "routes/api/blogRoutes.js" },
  { name: "Controller", file: "controllers/blogApiController.js" },
  { name: "Blog model", file: "models/Blog.js" },
  { name: "MongoDB", file: "blogs collection" },
];

const hex = () => Array.from({ length: 24 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
const now = (offsetDays = 0) => new Date(Date.now() - offsetDays * 864e5).toISOString();
const seed = () => [
  { _id: hex(), title: "Why I moved from circuits to code", body: "Engineering taught me to trace faults. The web gave me somewhere to use it.", author: "Samuel", createdAt: now(2), updatedAt: now(2), __v: 0 },
  { _id: hex(), title: "MVC in plain words", body: "Routes decide where a request goes, controllers decide what happens, models talk to the database.", author: "Samuel", createdAt: now(9), updatedAt: now(9), __v: 0 },
  { _id: hex(), title: "Hashing passwords with bcrypt", body: "Never store a password. Store a salted hash, and compare hashes at login.", author: "Samuel", createdAt: now(20), updatedAt: now(20), __v: 0 },
];

const ms = (a, b) => (a + Math.random() * (b - a)).toFixed(1);

function simulate(db, method, path, bodyText) {
  const steps = [{ node: 0, text: `${method} ${path}` }];
  const finish = (stopAt, status, json, nextDb = db) => ({ steps, stopAt, status, json, db: nextDb });

  let body = {};
  const hasBody = method === "POST" || method === "PUT";
  if (hasBody && bodyText.trim()) {
    try { body = JSON.parse(bodyText); }
    catch {
      steps.push({ node: 1, text: "express.json() could not parse the request body", t: ms(0.2, 0.6), bad: true });
      return finish(1, 400, { message: "Unexpected token in JSON body" });
    }
  }
  steps.push({ node: 1, text: hasBody ? "helmet added security headers, express.json() parsed the body" : "helmet added security headers, compression ready", t: ms(0.3, 0.9) });

  const base = path.match(/^\/api\/blogs\/?$/);
  const one = path.match(/^\/api\/blogs\/([^/]+)\/?$/);
  let fn = null;
  if (base && method === "GET") fn = "getBlog";
  if (base && method === "POST") fn = "createBlog";
  if (one && method === "GET") fn = "getBlogById";
  if (one && method === "PUT") fn = "updateBlog";
  if (one && method === "DELETE") fn = "deleteBlog";
  if (!fn) {
    steps.push({ node: 2, text: `No route for ${method} ${path}, so notFound() answered`, t: ms(0.1, 0.4), bad: true });
    return finish(2, 404, { message: `Not Found - ${path}` });
  }
  steps.push({ node: 2, text: `Matched ${method} ${one ? "/:id" : "/"} in /api/blogs`, t: ms(0.1, 0.3) });
  steps.push({ node: 3, text: `Called ${fn}(req, res, next)`, t: ms(0.1, 0.3) });

  const id = one && one[1];
  if (id && !/^[a-f0-9]{24}$/i.test(id)) {
    steps.push({ node: 4, text: `"${id}" is not a valid ObjectId, so Mongoose threw a CastError`, t: ms(0.2, 0.5), bad: true });
    return finish(4, 400, { message: `Cast to ObjectId failed for value "${id}" (type string) at path "_id" for model "Blog"` });
  }

  if (fn === "getBlog") {
    steps.push({ node: 4, text: "Blog.find().sort({ createdAt: -1 })", t: ms(0.2, 0.5) });
    const list = [...db].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    steps.push({ node: 5, text: `Returned ${list.length} documents`, t: ms(6, 18) });
    return finish(5, 200, list);
  }
  if (fn === "getBlogById" || fn === "deleteBlog") {
    const call = fn === "getBlogById" ? "Blog.findById(id)" : "Blog.findByIdAndDelete(id)";
    steps.push({ node: 4, text: call, t: ms(0.2, 0.5) });
    const found = db.find((b) => b._id === id);
    if (!found) {
      steps.push({ node: 5, text: "No document with that _id", t: ms(4, 12), bad: true });
      return finish(5, 404, { message: "Blog not found" });
    }
    if (fn === "getBlogById") {
      steps.push({ node: 5, text: "Found 1 document", t: ms(4, 12) });
      return finish(5, 200, found);
    }
    steps.push({ node: 5, text: "Deleted 1 document", t: ms(6, 16) });
    return finish(5, 200, { message: "Deleted" }, db.filter((b) => b._id !== id));
  }
  if (fn === "createBlog") {
    const doc = { title: typeof body.title === "string" ? body.title.trim() : body.title, body: body.body, author: body.author || "Anonymous" };
    const missing = ["title", "body"].filter((k) => !doc[k]);
    if (missing.length) {
      steps.push({ node: 4, text: `Validation failed: ${missing.join(" and ")} required`, t: ms(0.3, 0.7), bad: true });
      return finish(4, 400, { message: `Blog validation failed: ${missing.map((k) => `${k}: Path \`${k}\` is required.`).join(", ")}` });
    }
    steps.push({ node: 4, text: "Blog.create({ title, body, author }) passed validation", t: ms(0.3, 0.7) });
    const created = { _id: hex(), ...doc, createdAt: now(), updatedAt: now(), __v: 0 };
    steps.push({ node: 5, text: "Inserted 1 document", t: ms(8, 20) });
    return finish(5, 201, created, [created, ...db]);
  }
  // updateBlog
  steps.push({ node: 4, text: "Blog.findByIdAndUpdate(id, changes, { new: true, runValidators: true })", t: ms(0.3, 0.7) });
  const found = db.find((b) => b._id === id);
  if (!found) {
    steps.push({ node: 5, text: "No document with that _id", t: ms(4, 12), bad: true });
    return finish(5, 404, { message: "Blog not found" });
  }
  const changes = {};
  ["title", "body", "author"].forEach((k) => { if (body[k] !== undefined) changes[k] = body[k]; });
  if (changes.title === "" || changes.body === "") {
    steps.push({ node: 4, text: "Validation failed: title and body can't be empty", t: ms(0.3, 0.7), bad: true });
    return finish(4, 400, { message: "Validation failed: Path `title` is required." });
  }
  const updated = { ...found, ...changes, updatedAt: now() };
  steps.push({ node: 5, text: "Updated 1 document", t: ms(6, 16) });
  return finish(5, 200, updated, db.map((b) => (b._id === id ? updated : b)));
}

const STATUS = { 200: "OK", 201: "Created", 400: "Bad Request", 404: "Not Found" };

export default function Playground({ copy }) {
  const [db, setDb] = useState(seed);
  const firstId = db[0] ? db[0]._id : "000000000000000000000000";
  const presets = useMemo(() => [
    { label: "List all posts", method: "GET", path: "/api/blogs", body: "" },
    { label: "Read one post", method: "GET", path: `/api/blogs/${firstId}`, body: "" },
    { label: "Write a post", method: "POST", path: "/api/blogs", body: JSON.stringify({ title: "Hello from a visitor", body: "I sent this from the playground.", author: "You" }, null, 2) },
    { label: "Forget the title", method: "POST", path: "/api/blogs", body: JSON.stringify({ body: "A post with no title." }, null, 2) },
    { label: "Edit a post", method: "PUT", path: `/api/blogs/${firstId}`, body: JSON.stringify({ title: "Edited from the playground" }, null, 2) },
    { label: "Delete a post", method: "DELETE", path: `/api/blogs/${firstId}`, body: "" },
    { label: "Ask for a missing post", method: "GET", path: "/api/blogs/000000000000000000000000", body: "" },
  ], [firstId]);

  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/api/blogs");
  const [bodyText, setBodyText] = useState("");
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState(-1);
  const [visited, setVisited] = useState({ upTo: -1, bad: -1 });
  const [log, setLog] = useState([]);
  const [response, setResponse] = useState(null);
  const timers = useRef([]);

  const pick = (p) => { setMethod(p.method); setPath(p.path); setBodyText(p.body); };

  const send = () => {
    if (running) return;
    timers.current.forEach(clearTimeout); timers.current = [];
    const result = simulate(db, method, path.trim(), bodyText);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = reduced ? 0 : 320;
    setRunning(true); setLog([]); setResponse(null); setVisited({ upTo: -1, bad: -1 });

    // Out through each layer, then back to the browser
    const route = [];
    for (let i = 0; i <= result.stopAt; i++) route.push(i);
    for (let i = result.stopAt - 1; i >= 0; i--) route.push(i);
    route.forEach((node, k) => {
      timers.current.push(setTimeout(() => {
        setActive(node);
        if (k <= result.stopAt) {
          const s = result.steps.filter((x) => x.node === node);
          setLog((l) => [...l, ...s]);
          const bad = s.some((x) => x.bad);
          setVisited((v) => ({ upTo: Math.max(v.upTo, node), bad: bad ? node : v.bad }));
        }
      }, k * step));
    });
    timers.current.push(setTimeout(() => {
      setActive(-1); setRunning(false);
      const json = JSON.stringify(result.json, null, 2);
      setResponse({ status: result.status, json, size: new Blob([json]).size });
      setDb(result.db);
    }, route.length * step + 60));
  };

  const reset = () => { setDb(seed()); setLog([]); setResponse(null); setVisited({ upTo: -1, bad: -1 }); };

  return (
    <section className="play" id="playground" aria-labelledby="play-title">
      <div className="play__inner">
        <div className="play__intro">
          <p className="tag">{copy.tag}</p>
          <h2 id="play-title">{copy.title}</h2>
          <p>{copy.text}</p>
        </div>

        <div className="play__grid">
          <div className="play__req">
            <p className="play__label">Pick a request</p>
            <div className="presets">
              {presets.map((p) => (
                <button key={p.label} type="button" onClick={() => pick(p)} className={p.method === method && p.path === path && p.body === bodyText ? "is-on" : ""}>
                  {p.label}
                </button>
              ))}
            </div>
            <p className="play__label">Or write your own</p>
            <div className="reqline">
              <label className="sr">Method
                <select value={method} onChange={(e) => setMethod(e.target.value)}>
                  {["GET", "POST", "PUT", "DELETE"].map((m) => <option key={m}>{m}</option>)}
                </select>
              </label>
              <label className="sr grow">Path
                <input value={path} onChange={(e) => setPath(e.target.value)} spellCheck="false" />
              </label>
            </div>
            {(method === "POST" || method === "PUT") && (
              <label className="bodybox">
                <span className="play__label">Request body (JSON)</span>
                <textarea rows="6" value={bodyText} onChange={(e) => setBodyText(e.target.value)} spellCheck="false" />
              </label>
            )}
            <div className="play__actions">
              <button type="button" className="send" onClick={send} disabled={running}>{running ? "Sending…" : "Send request"}</button>
              <button type="button" className="resetbtn" onClick={reset}>Reset the data</button>
              <span className="play__count">{db.length} posts in the database</span>
            </div>
          </div>

          <div className="play__out">
            <ol className="flow" aria-label="Where the request goes">
              {NODES.map((n, i) => (
                <li key={n.name} className={[
                  "flow__node",
                  active === i ? "is-active" : "",
                  i <= visited.upTo ? "is-visited" : "",
                  visited.bad === i ? "is-bad" : "",
                ].join(" ")}>
                  <strong>{n.name}</strong>
                  <span>{n.file}</span>
                </li>
              ))}
            </ol>

            <div className="console" aria-live="polite">
              {log.length === 0 && !response && <p className="console__empty">Send a request to see each step it takes.</p>}
              {log.map((s, i) => (
                <p key={i} className={s.bad ? "bad" : ""}>
                  <span className="where">{NODES[s.node].name}</span> {s.text}{s.t ? <em> {s.t} ms</em> : null}
                </p>
              ))}
              {response && (
                <div className="resp">
                  <p className={`status ${response.status >= 400 ? "bad" : "good"}`}>{response.status} {STATUS[response.status]} <em>{response.size} bytes</em></p>
                  <pre>{response.json}</pre>
                </div>
              )}
            </div>
            <p className="play__note">Timings are simulated. The real code is on <a href="https://github.com/Lasgidid/blog-mvc-hbs" target="_blank" rel="noreferrer">GitHub</a>.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
