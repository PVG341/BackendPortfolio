'use client';

import Image from 'next/image';
import { ApiStatus } from '@/components/api-status';
import { ContactForm } from '@/components/contact-form';
import { LanguageToggle, useLanguage } from '@/components/language-context';
import { RateLimitPlayground } from '@/components/rate-limit-playground';
import { SqlInjectionPlayground } from '@/components/sql-injection-playground';
import { sharedProfile } from '@/data/profile';

export function PortfolioPage() {
  const { content } = useLanguage();

  return (
    <main>
      <nav>
        <a href="#home" className="brand">
          {sharedProfile.name.toUpperCase()} / {content.brandSuffix}
        </a>
        <div className="nav-right">
          <div className="nav-links">
            <a href="#about">{content.nav.about}</a>
            <a href="#experience">{content.nav.experience}</a>
            <a href="#skills">{content.nav.skills}</a>
            <a href="#education">{content.nav.education}</a>
            <a href="#platform">{content.nav.playground}</a>
            <a href="#projects">{content.nav.projects}</a>
            <a href="#contact">{content.nav.contact}</a>
          </div>
          <LanguageToggle />
        </div>
      </nav>

      {/* Hero Section: Personal Introduction & Avatar */}
      <section id="home" className="hero">
        <div className="status-pill">
          <span className="status-dot"></span>
          <span>{content.hero.status}</span>
        </div>

        <div className="hero-header">
          <div>
            <p className="eyebrow">{content.hero.eyebrow}</p>
            <h1>{content.hero.greeting}</h1>
            <p className="hero-subtitle">{content.hero.subtitle}</p>
          </div>
          <div className="avatar-wrap">
            <Image
              src={sharedProfile.avatar}
              alt={sharedProfile.name}
              width={220}
              height={220}
              className="avatar-img"
              priority
            />
          </div>
        </div>

        <p className="lead">{content.hero.intro}</p>

        <div className="cta-group">
          <a
            href={sharedProfile.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
          >
            <span>{content.hero.ctaResume}</span>
          </a>
          <a
            href={sharedProfile.socials.github}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
          >
            <span>{content.hero.ctaGithub}</span>
          </a>
          <a
            href={sharedProfile.socials.linkedin}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
          >
            <span>LinkedIn ↗</span>
          </a>
          <a href="#projects" className="btn-secondary">
            <span>{content.hero.ctaProjects}</span>
          </a>
        </div>

        <div className="chips hero-chips">
          {content.hero.quickChips.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>
      </section>

      {/* About / My Story Section */}
      <section id="about">
        <p className="eyebrow">{content.about.eyebrow}</p>
        <h2>{content.about.heading}</h2>
        <div className="story-card">
          <div className="story-paragraphs">
            {content.about.paragraphs.map((paragraph, index) => (
              <p key={index} className="muted">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="about-traits">
            {content.about.traits.map((trait) => (
              <div key={trait} className="about-trait">
                <span className="trait-dot" aria-hidden="true" />
                <span>{trait}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Work Experience Timeline Tree */}
      <section id="experience">
        <p className="eyebrow">{content.experience.eyebrow}</p>
        <h2>{content.experience.heading}</h2>
        <p className="muted">{content.experience.intro}</p>
        <div className="timeline">
          {content.experience.items.map((item, idx) => (
            <article key={idx} className="timeline-item">
              <div className="timeline-item__dot" aria-hidden="true" />
              <div className="timeline-item__header">
                <div className="timeline-item__meta">
                  <span className="timeline-item__period">{item.period}</span>
                  {item.location && (
                    <span className="timeline-item__location">{item.location}</span>
                  )}
                </div>
                <h3>{item.role}</h3>
                <p className="timeline-item__company">{item.company}</p>
              </div>
              {item.summary && <p className="timeline-item__summary">{item.summary}</p>}
              <ul>
                {item.details.map((detail, detailIdx) => (
                  <li key={detailIdx}>{detail}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Categorized Skills Section */}
      <section id="skills">
        <p className="eyebrow">{content.skills.eyebrow}</p>
        <h2>{content.skills.heading}</h2>
        <p className="muted">{content.skills.intro}</p>
        <div className="skills-grid">
          {content.skills.groups.map((skillGroup) => (
            <div key={skillGroup.category} className="skill-card">
              <div className="skill-card-header">
                <h4>{skillGroup.category}</h4>
                <span className="skill-count">
                  {skillGroup.items.length} {content.skills.countLabel}
                </span>
              </div>
              <div className="chips">
                {skillGroup.items.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Education Background */}
      <section id="education">
        <p className="eyebrow">{content.education.eyebrow}</p>
        <h2>{content.education.heading}</h2>
        <div className="edu-timeline">
          {content.education.items.map((edu, idx) => (
            <div key={idx} className="edu-card">
              <div className="edu-card-header">
                <div>
                  <h3>{edu.degree}</h3>
                  <div className="edu-school">{edu.school}</div>
                </div>
                <span className="edu-period">{edu.period}</span>
              </div>
              {edu.description && (
                <p className="muted" style={{ margin: '6px 0 0' }}>
                  {edu.description}
                </p>
              )}
              {edu.highlights && edu.highlights.length > 0 && (
                <ul className="edu-list">
                  {edu.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* About This Website & Live Backend Playgrounds */}
      <section id="platform" className="platform-section">
        <div className="platform-intro">
          <p className="eyebrow">{content.platformIntro.eyebrow}</p>
          <h2>{content.platformIntro.heading}</h2>
          <p className="lead">{content.platformIntro.description}</p>
          <p className="muted">{content.platformIntro.details}</p>
          <div className="platform-meta">
            <div className="chips">
              {content.platformIntro.badges.map((badge) => (
                <span key={badge}>{badge}</span>
              ))}
            </div>
            <ApiStatus />
          </div>
        </div>

        <RateLimitPlayground />
        <SqlInjectionPlayground />
      </section>

      {/* Projects Showcase Grid */}
      <section id="projects">
        <p className="eyebrow">{content.projects.eyebrow}</p>
        <h2>{content.projects.heading}</h2>
        <div className="projects-grid">
          {content.projects.items.map((proj, idx) => (
            <div key={idx} className={`project-card ${proj.featured ? 'featured' : ''}`}>
              <div>
                {proj.featured && (
                  <span className="project-badge">{content.projects.featuredBadge}</span>
                )}
                <div className="project-header">
                  <h3>{proj.title}</h3>
                </div>
                <div className="project-tagline">{proj.tagline}</div>
                <p className="project-desc">{proj.description}</p>
                <div className="project-tags">
                  {proj.tags.map((tag) => (
                    <span key={tag} className="project-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="project-links">
                {proj.githubUrl && (
                  <a href={proj.githubUrl} target="_blank" rel="noreferrer">
                    {content.projects.sourceCode}
                  </a>
                )}
                {proj.liveUrl && (
                  <a
                    href={proj.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent)' }}
                  >
                    {content.projects.livePreview}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="panel">
        <p className="eyebrow">{content.contact.eyebrow}</p>
        <h2>{content.contact.heading}</h2>
        <p className="muted">{content.contact.description}</p>
        <div className="chips" style={{ marginTop: '14px', marginBottom: '6px' }}>
          <span>
            <a
              href={`mailto:${sharedProfile.socials.email}`}
              style={{ color: 'var(--accent)', textDecoration: 'none' }}
            >
              ✉ {sharedProfile.socials.email}
            </a>
          </span>
          <span>
            <a
              href={`tel:${sharedProfile.socials.phone}`}
              style={{ color: 'var(--text)', textDecoration: 'none' }}
            >
              📞 {sharedProfile.socials.phone}
            </a>
          </span>
          <span>
            <a
              href={sharedProfile.socials.linkedin}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--text)', textDecoration: 'none' }}
            >
              in LinkedIn ↗
            </a>
          </span>
          <span>
            <a
              href={sharedProfile.socials.github}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--text)', textDecoration: 'none' }}
            >
              ⌘ GitHub ↗
            </a>
          </span>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}
