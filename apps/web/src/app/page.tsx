import { ApiStatus } from '@/components/api-status';
import { ContactForm } from '@/components/contact-form';
import { RateLimitPlayground } from '@/components/rate-limit-playground';
import { SqlInjectionPlayground } from '@/components/sql-injection-playground';

const skills = ['NestJS', 'Fastify', 'TypeScript', 'Redis', 'PostgreSQL', 'Docker', 'API Security'];

export default function Home() {
  return (
    <main>
      <nav>
        <a href="#home" className="brand">
          PVG / BACKEND
        </a>
        <div>
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#playground">Playground</a>
          <a href="#sql">SQL</a>
          <a href="#projects">Projects</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <section id="home" className="hero">
        <p className="eyebrow">Backend engineer · API security</p>
        <h1>Build APIs that remain predictable under pressure.</h1>
        <p className="lead">
          I design backend systems with explicit contracts, observable behavior, secure boundaries,
          and failure modes that users can understand.
        </p>
        <ApiStatus />
      </section>

      <section id="about">
        <p className="eyebrow">About</p>
        <h2>Engineering for the path that fails.</h2>
        <p className="muted">
          My focus is backend API development: validation, authentication boundaries, rate limiting,
          database safety, and practical observability.
        </p>
      </section>

      <section id="skills">
        <p className="eyebrow">Stack</p>
        <h2>Tools I use deliberately.</h2>
        <div className="chips">
          {skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      </section>

      <RateLimitPlayground />
      <SqlInjectionPlayground />

      <section id="projects">
        <p className="eyebrow">Projects</p>
        <h2>Selected backend work.</h2>
        <div className="project">
          <strong>Interactive Backend Portfolio</strong>
          <span>NestJS · Redis · PostgreSQL · API security playground</span>
          <a href="https://github.com/PVG341/BackendPortfolio" rel="noreferrer">
            Source
          </a>
        </div>
      </section>

      <section id="contact" className="panel">
        <p className="eyebrow">Contact</p>
        <h2>Let&apos;s discuss backend problems.</h2>
        <p className="muted">
          This form is rate limited and protected by a honeypot. Messages are delivered by email.
        </p>
        <ContactForm />
      </section>
    </main>
  );
}
