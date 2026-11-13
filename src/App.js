import React, { useEffect, useRef, useState } from "react";
import { createScene } from "./Scene";
import { profile, story, projects } from "./data";
import Particles from "./Particles";
import Playground from "./Playground";
import { usePresence, PresenceLayer } from "./Presence";

function useScrollStory(canvasRef) {
  const [active, setActive] = useState(0);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scene;
    try {
      scene = createScene(canvasRef.current, projects, { reducedMotion: reduced });
    } catch (err) {
      setWebgl(false);
    }

    let centers = [];
    const measure = () => {
      centers = [...document.querySelectorAll("[data-chapter]")].map((el) => {
        const r = el.getBoundingClientRect();
        return r.top + window.scrollY + r.height / 2;
      });
    };
    const onScroll = () => {
      const y = window.scrollY + window.innerHeight / 2;
      let c = 0;
      if (y <= centers[0]) c = 0;
      else if (y >= centers[centers.length - 1]) c = centers.length - 1;
      else {
        for (let i = 0; i < centers.length - 1; i++) {
          if (y < centers[i + 1]) { c = i + (y - centers[i]) / (centers[i + 1] - centers[i]); break; }
        }
      }
      scene && scene.setProgress(c);
      setActive(Math.round(c));
    };
    const onResize = () => { measure(); onScroll(); };
    measure(); onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.fonts && document.fonts.ready.then(onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      scene && scene.dispose();
    };
  }, [canvasRef]);

  return { active, webgl };
}

function Chapter({ index, active, className = "", children, label }) {
  return (
    <section data-chapter={index} aria-label={label} className={`chapter ${className} ${active === index ? "is-active" : ""}`}>
      <div className="chapter__text">{children}</div>
    </section>
  );
}

function Links({ p }) {
  return (
    <p className="links">
      {p.live && <a href={p.live} target="_blank" rel="noreferrer">Visit the site</a>}
      {p.code && <a href={p.code} target="_blank" rel="noreferrer">Read the code</a>}
    </p>
  );
}

export default function App() {
  const canvasRef = useRef(null);
  const { active, webgl } = useScrollStory(canvasRef);
  const base = 1 + story.chapters.length;
  const skillsIndex = base + projects.length;
  const mscIndex = skillsIndex + 1;
  const contactIndex = mscIndex + 1;
  const presence = usePresence();

  return (
    <>
      <Particles />
      <canvas ref={canvasRef} className="stage" aria-hidden="true" />
      {!webgl && <div className="stage stage--fallback" aria-hidden="true" />}
      <div className="scrim" aria-hidden="true" />

      <header className="top">
        <a href="#start" className="top__name">{profile.name}</a>
        <span className="top__right">
          {presence.enabled && presence.others > 0 && (
            <span className="top__live"><i /> {presence.others === 1 ? "1 other person is here" : `${presence.others} other people are here`}</span>
          )}
          <a href={`mailto:${profile.email}`} className="top__mail">Email me</a>
        </span>
      </header>

      <main id="start">
        <Chapter index={0} active={active} className="chapter--intro" label="Introduction">
          <h1 className="intro__title">{story.intro.title}</h1>
          <p className="intro__text">{story.intro.text}</p>
          <p className="intro__hint">{story.intro.hint}</p>
        </Chapter>

        {story.chapters.map((c, i) => (
          <Chapter key={c.tag} index={i + 1} active={active} label={c.tag}>
            <p className="tag">{c.tag}</p>
            <h2>{c.title}</h2>
            <p>{c.text}</p>
            {c.aside && <p className="aside">{c.aside}</p>}
          </Chapter>
        ))}

        {projects.map((p, j) => (
          <Chapter key={p.title} index={base + j} active={active} className="chapter--project" label={p.title}>
            <p className="tag" style={{ "--c": p.color }}>
              {p.kind}
            </p>
            <h2>{p.title}</h2>
            <p>{p.description}</p>
            <p className="tech">Built with {p.tech}</p>
            <Links p={p} />
          </Chapter>
        ))}

        <Playground copy={story.playground} />

        <Chapter index={skillsIndex} active={active} label={story.skills.tag}>
          <p className="tag">{story.skills.tag}</p>
          <h2>{story.skills.title}</h2>
          <dl className="parts">
            {story.skills.groups.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </Chapter>

        <Chapter index={mscIndex} active={active} label={story.msc.tag}>
          <p className="tag">{story.msc.tag}</p>
          <h2>{story.msc.title}</h2>
          <p>{story.msc.text}</p>
        </Chapter>

        <Chapter index={contactIndex} active={active} className="chapter--contact" label={story.contact.tag}>
          <p className="tag">{story.contact.tag}</p>
          <h2>{story.contact.title}</h2>
          <p>{story.contact.text}</p>
          <a className="mail" href={`mailto:${profile.email}`}>{profile.email}</a>
          <ul className="contact">
            <li>{profile.phone}</li>
            <li>{profile.location}</li>
            <li><a href={profile.github} target="_blank" rel="noreferrer">GitHub</a></li>
            <li><a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></li>
            <li><a href={profile.twitter} target="_blank" rel="noreferrer">X</a></li>
          </ul>
        </Chapter>
      </main>

      {presence.enabled && <PresenceLayer cursors={presence.cursors} />}
      <footer className="foot">© {new Date().getFullYear()} {profile.name}</footer>
    </>
  );
}
