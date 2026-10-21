import { RateLimitPlayground } from '@/components/rate-limit-playground';
import { getHealth } from '@/lib/api-client';

const skills = ['NestJS / Fastify', 'Redis + Lua', 'PostgreSQL', 'TypeScript', 'Docker', 'API Security'];

export default async function Home() {
  let health = 'Offline';
  try { health = (await getHealth()).status === 'ok' ? 'Online' : 'Unhealthy'; } catch {}
  return <main>
    <nav><a href="#home" className="brand">PVG / BACKEND</a><div><a href="#about">About</a><a href="#skills">Skills</a><a href="#playground">Playground</a><a href="#projects">Projects</a><a href="#contact">Contact</a></div></nav>
    <section id="home" className="hero"><p className="eyebrow">Backend engineer · API security</p><h1>Build APIs that remain predictable under pressure.</h1><p className="lead">I design backend systems with explicit contracts, observable behavior, secure boundaries, and failure modes that users can understand.</p><div className="health"><span className={health === 'Online' ? 'dot online' : 'dot'} /> API status: {health}</div></section>
    <section id="about"><p className="eyebrow">About</p><h2>Engineering for the path that fails.</h2><p className="muted">My focus is backend API development: validation, authentication boundaries, rate limiting, database safety, and practical observability.</p></section>
    <section id="skills"><p className="eyebrow">Stack</p><h2>Tools I use deliberately.</h2><div className="chips">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section>
    <RateLimitPlayground />
    <section id="sql" className="panel"><p className="eyebrow">Coming next</p><h2>SQL injection sandbox</h2><p className="muted">A public, isolated PostgreSQL demonstration comparing concatenated SQL with parameterized queries. It uses fictional data and a read-only database role.</p></section>
    <section id="projects"><p className="eyebrow">Projects</p><h2>Selected backend work.</h2><div className="project"><strong>Interactive Backend Portfolio</strong><span> NestJS · Redis · API security playground</span></div></section>
    <section id="contact" className="panel"><p className="eyebrow">Contact</p><h2>Let&apos;s discuss backend problems.</h2><p className="muted">The protected contact form and Resend delivery integration are the next module in this portfolio.</p></section>
  </main>;
}