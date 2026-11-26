import type { StaticImageData } from 'next/image';
import avatarImg from './avatar.png';

export type Locale = 'en' | 'vi';

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface EducationItem {
  degree: string;
  school: string;
  period: string;
  description?: string;
  highlights?: string[];
}

export interface ExperienceItem {
  period: string;
  role: string;
  company: string;
  location?: string;
  summary?: string;
  details: string[];
}

export interface ProjectItem {
  title: string;
  tagline: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  liveUrl?: string;
  featured?: boolean;
}

export interface LocalizedPortfolioContent {
  brandSuffix: string;
  nav: {
    about: string;
    experience: string;
    skills: string;
    education: string;
    playground: string;
    projects: string;
    contact: string;
  };
  hero: {
    status: string;
    eyebrow: string;
    greeting: string;
    subtitle: string;
    intro: string;
    ctaResume: string;
    ctaGithub: string;
    ctaProjects: string;
    quickChips: string[];
  };
  about: {
    eyebrow: string;
    heading: string;
    paragraphs: string[];
    traits: string[];
  };
  experience: {
    eyebrow: string;
    heading: string;
    intro: string;
    items: ExperienceItem[];
  };
  skills: {
    eyebrow: string;
    heading: string;
    intro: string;
    countLabel: string;
    groups: SkillGroup[];
  };
  education: {
    eyebrow: string;
    heading: string;
    items: EducationItem[];
  };
  platformIntro: {
    eyebrow: string;
    heading: string;
    description: string;
    details: string;
    badges: string[];
  };
  projects: {
    eyebrow: string;
    heading: string;
    featuredBadge: string;
    sourceCode: string;
    livePreview: string;
    items: ProjectItem[];
  };
  contact: {
    eyebrow: string;
    heading: string;
    description: string;
  };
  ui: {
    apiStatus: {
      label: string;
      checking: string;
      ready: string;
      offline: string;
      retry: string;
    };
    contactForm: {
      name: string;
      email: string;
      message: string;
      website: string;
      sending: string;
      submit: string;
      accepted: string;
      tooMany: (seconds: number) => string;
      failedFallback: string;
      unavailable: string;
    };
    rateLimit: {
      eyebrow: string;
      heading: string;
      description: string;
      limitLabel: string;
      windowLabel: string;
      algorithmLabel: string;
      slidingOption: string;
      fixedOption: string;
      burstLabel: string;
      requestSingular: string;
      requestPlural: string;
      createSession: string;
      sendOne: string;
      sendBurst: (count: number) => string;
      stop: string;
      reset: string;
      initialMessage: string;
      sessionCreated: (limit: number, windowSeconds: number) => string;
      apiUnavailable: string;
      burstStopped: string;
      sessionExpired: string;
      serviceQuotaExceeded: string;
      createFailedFallback: string;
      requestFailed: string;
      stoppingBurst: string;
      sessionReset: string;
      resetFailed: string;
      sessionActive: string;
      sessionLimitSummary: (limit: number, windowSeconds: number) => string;
      historyHeading: string;
      historyShowing: (visible: number, total: number, max: number) => string;
      awaitingActivity: string;
      remaining: string;
      retryIn: (seconds: number) => string;
      accepted: string;
      serviceQuota: string;
      demoQuota: string;
    };
    sqlPlayground: {
      eyebrow: string;
      heading: string;
      description: string;
      modeAria: string;
      unsafeOption: string;
      safeOption: string;
      inputPlaceholder: string;
      runQuery: string;
      presets: { label: string; value: string }[];
      rejectedFallback: string;
      unavailable: string;
      noRows: string;
      colId: string;
      colUsername: string;
      colRole: string;
    };
  };
}

export const sharedProfile = {
  name: 'Hồ Sỹ Phúc',
  avatar: avatarImg as StaticImageData,
  resumeUrl: '/CV_Backend_engineer_PH_VerENG.pdf',
  socials: {
    github: 'https://github.com/PVG341',
    linkedin: 'https://www.linkedin.com/in/ph%C3%BAc-h%E1%BB%93-s%E1%BB%B9-600980363/',
    email: 'hosyphuc246@gmail.com',
    phone: '0819229159',
  },
};

export const portfolioContent: Record<Locale, LocalizedPortfolioContent> = {
  en: {
    brandSuffix: 'BACKEND',
    nav: {
      about: 'About',
      experience: 'Experience',
      skills: 'Skills',
      education: 'Education',
      playground: 'Playgrounds',
      projects: 'Projects',
      contact: 'Contact',
    },
    hero: {
      status: 'Open to Work / Actively Seeking Backend & Cloud Roles',
      eyebrow: 'Portfolio 2026 · Software Engineer',
      greeting: "Hi, I'm Hồ Sỹ Phúc.",
      subtitle: 'Backend Engineer · AWS Cloud · WordPress & AI Workflows',
      intro:
        'Software Engineering student at Văn Lang University with hands-on experience in Node.js/NestJS backend systems, AWS cloud architecture from my internship at AWS First Cloud Journey, WordPress & Elementor web development, and modern AI/AI Agent workflows.',
      ctaResume: '📄 View Resume / CV',
      ctaGithub: 'GitHub Profile ↗',
      ctaProjects: 'Explore Projects ↓',
      quickChips: [
        'Node.js / NestJS',
        'AWS Cloud',
        'Redis & PostgreSQL',
        'WordPress & Elementor',
        'AI Agents',
      ],
    },
    about: {
      eyebrow: 'My Story',
      heading: 'From building web products to designing resilient backend & cloud systems.',
      paragraphs: [
        'I am a Software Engineering student at Văn Lang University (2022–2026) with a strong focus on backend development, cloud infrastructure, and practical web delivery. My journey started with building complete web applications—ranging from PHP/MySQL e-commerce systems and WordPress/Elementor websites to real-time Node.js & React platforms.',
        'During my internship at AWS First Cloud Journey, I dove deep into cloud architecture, serverless services, and API protection patterns such as multi-tier rate limiting with Amazon API Gateway, Lambda Authorizers, and CloudWatch monitoring. Today, I combine disciplined backend engineering with modern AI and AI Agent tools to ship clean, reliable, and well-tested software faster.',
      ],
      traits: [
        'Resilient backend APIs with Node.js, NestJS, Fastify, PostgreSQL & Redis',
        'Hands-on AWS cloud architecture experience from AWS First Cloud Journey',
        'Practical web delivery with WordPress, Elementor & responsive layouts',
        'Proficient in leveraging modern AI & AI Agent tools for engineering productivity',
      ],
    },
    experience: {
      eyebrow: 'Work Experience',
      heading: 'Hands-on journey in cloud & backend engineering.',
      intro:
        'Practical industry exposure building cloud-native architectures, technical workshops, and secure API workflows.',
      items: [
        {
          period: 'Internship · AWS First Cloud Journey',
          role: 'Cloud & Backend Intern',
          company: 'AWS First Cloud Journey (FCJ)',
          location: 'Ho Chi Minh City, Vietnam',
          summary:
            'Participated in AWS First Cloud Journey internship program focusing on cloud-native architectures, serverless security, and production API management.',
          details: [
            'Designed and implemented a multi-tier API Rate Limiting & Throttling architecture on AWS using Amazon API Gateway, Usage Plans, API Keys, and custom AWS Lambda Authorizers.',
            'Automated scheduled quota adjustments with Amazon EventBridge and configured Amazon CloudWatch Alarms to monitor HTTP 429 rate-limit breaches.',
            'Built and published a complete step-by-step technical workshop (Hugo + Amazon S3 / GitHub Pages) guiding developers through cloud API protection and resource clean-up.',
            'Practiced IAM least-privilege security, serverless deployment workflows, and collaborative technical documentation in a real-world cloud environment.',
          ],
        },
      ],
    },
    skills: {
      eyebrow: 'Technical Expertise',
      heading: 'Tools and systems I use deliberately.',
      intro:
        'A practical stack spanning backend engineering, cloud infrastructure, WordPress web delivery, and AI-assisted development.',
      countLabel: 'skills',
      groups: [
        {
          category: 'Backend & Core',
          items: [
            'Node.js',
            'TypeScript',
            'NestJS',
            'Fastify',
            'Express',
            'PHP (MVC)',
            'RESTful APIs',
            'Socket.io',
          ],
        },
        {
          category: 'Databases & In-Memory',
          items: [
            'PostgreSQL',
            'MySQL',
            'Redis',
            'Redis Lua Scripts',
            'Transaction Isolation',
            'Query Optimization',
          ],
        },
        {
          category: 'Cloud & DevOps',
          items: [
            'AWS API Gateway',
            'AWS Lambda',
            'Amazon S3 & CloudWatch',
            'Amazon EventBridge',
            'Docker & Compose',
            'GitHub Actions (CI/CD)',
            'Render & Vercel',
          ],
        },
        {
          category: 'Web CMS & AI Productivity',
          items: [
            'WordPress',
            'Elementor',
            'AI / AI Agent Tools',
            'AI-Assisted Coding & Debugging',
            'Prompt Engineering',
            'Agentic Workflows',
          ],
        },
        {
          category: 'Security & Quality',
          items: [
            'API Rate Limiting',
            'SQL Injection Mitigation',
            'Input Sanitization',
            'Vitest',
            'Unit & E2E Testing',
          ],
        },
      ],
    },
    education: {
      eyebrow: 'Education',
      heading: 'Academic foundation.',
      items: [
        {
          degree: 'Bachelor of Information Technology / Software Engineering',
          school: 'Văn Lang University',
          period: '2022 — 2026',
          description: 'Major in Software Development & Computer Systems · GPA: 3.07/4.0.',
          highlights: [
            'GPA: 3.07/4.0 · Ho Chi Minh City, Vietnam.',
            'Relevant Coursework: Data Structures & Algorithms, Database Systems, Computer Networks, Distributed Systems.',
            'Built end-to-end academic and personal software projects across web, backend, and cloud.',
          ],
        },
      ],
    },
    platformIntro: {
      eyebrow: 'About This Website · Live Backend Sandbox',
      heading: 'Build APIs that remain predictable under pressure.',
      description:
        'Backend engineering portfolio focused on API contracts, Redis rate limiting, SQL safety, and API security.',
      details:
        'Rather than just listing backend skills on paper, this website connects directly to a live NestJS + Fastify API backed by Redis and PostgreSQL. You can test atomic rate-limiting algorithms and an isolated SQL injection sandbox right below.',
      badges: [
        'NestJS + Fastify',
        'Redis Lua Quotas',
        'PostgreSQL Read-Only Role',
        'Live Telemetry',
      ],
    },
    projects: {
      eyebrow: 'Work & Systems',
      heading: 'Featured & recent projects.',
      featuredBadge: '★ Featured Project',
      sourceCode: 'Source Code ↗',
      livePreview: 'Live Preview ↗',
      items: [
        {
          title: 'Interactive Backend Portfolio & Security Sandbox',
          tagline: 'Redis Lua Quotas · PostgreSQL SQL Sandbox · Resend Integration',
          description:
            'A full-stack backend portfolio featuring atomic rate limiting algorithms (Fixed Window & Sliding Window Log), an isolated SQL injection demo sandbox with a SELECT-only role, and an automated contact delivery pipeline.',
          tags: ['NestJS', 'Fastify', 'Redis', 'PostgreSQL', 'Next.js 16', 'Docker', 'TypeScript'],
          githubUrl: 'https://github.com/PVG341/BackendPortfolio',
          liveUrl: 'https://hosyphuc246-portfolio.vercel.app',
          featured: true,
        },
        {
          title: 'AWS API Rate Limiting & Throttling Architecture Workshop',
          tagline: 'API Gateway · Lambda Authorizer · Usage Plans · CloudWatch Alarms',
          description:
            'A hands-on cloud engineering workshop demonstrating multi-tier API rate limiting and quota enforcement on AWS. Covers REST API Gateway throttling, API Keys with Usage Plans, custom Lambda Authorizers, EventBridge automated quota scheduling, and CloudWatch alarms for 429 breach monitoring.',
          tags: [
            'AWS API Gateway',
            'AWS Lambda',
            'Amazon CloudWatch',
            'EventBridge',
            'Hugo',
            'Cloud Architecture',
          ],
          githubUrl: 'https://github.com/PVG341/API-RateLimit-Workshop',
          liveUrl: 'https://pvg341.github.io/API-RateLimit-Workshop',
          featured: false,
        },
        {
          title: 'Gia Sư Tại Nhà — Tutor Marketplace Platform',
          tagline: 'Real-Time Chat (Socket.io) · VNPAY Integration · Tutor Booking',
          description:
            'An on-demand home tutoring marketplace connecting students with verified tutors. Features dynamic tutor search and filtering, automated booking and scheduling workflows, secure online payment via VNPAY, real-time messaging with Socket.io, and user review systems.',
          tags: ['Node.js', 'Express', 'React', 'PostgreSQL', 'Socket.io', 'VNPAY', 'Tailwind CSS'],
          githubUrl: 'https://github.com/PVG341/GiaSuTaiNha',
          featured: false,
        },
        {
          title: 'TechStore — E-Commerce Web System',
          tagline: 'Native MVC Pattern · Order & Inventory Management · PHPMailer',
          description:
            'A full-featured e-commerce platform for tech hardware and gaming gear. Built with native PHP following strict MVC architecture, featuring product variant management, dynamic shopping cart calculation, voucher discount rules, member tiering, automated email notifications via PHPMailer, and an admin management dashboard.',
          tags: ['PHP', 'MySQL', 'Bootstrap', 'PHPMailer', 'MVC Architecture', 'JavaScript'],
          githubUrl: 'https://github.com/PVG341/DoAn-Web-E-commercial',
          featured: false,
        },
      ],
    },
    contact: {
      eyebrow: 'Contact',
      heading: "Let's discuss backend & web opportunities.",
      description:
        'This form is rate limited and protected by a honeypot. Messages are delivered directly to my inbox via Resend.',
    },
    ui: {
      apiStatus: {
        label: 'API status',
        checking: 'checking',
        ready: 'ready',
        offline: 'offline',
        retry: 'Retry',
      },
      contactForm: {
        name: 'Name',
        email: 'Email',
        message: 'Message',
        website: 'Website',
        sending: 'Sending…',
        submit: 'Send message',
        accepted: 'Message received. Thank you.',
        tooMany: (seconds) => `Too many messages. Try again in ${seconds}s.`,
        failedFallback: 'The message could not be sent.',
        unavailable: 'Contact is unavailable. Check the API connection.',
      },
      rateLimit: {
        eyebrow: 'Live security demo',
        heading: 'Rate-limiting playground',
        description:
          'Observe server-issued session tokens, atomic Redis decisions, quota headers, and HTTP 429 responses.',
        limitLabel: 'Request limit (1–20)',
        windowLabel: 'Window (1–60 seconds)',
        algorithmLabel: 'Algorithm',
        slidingOption: 'Sliding Window',
        fixedOption: 'Fixed Window',
        burstLabel: 'Burst size',
        requestSingular: 'request',
        requestPlural: 'requests',
        createSession: 'Create demo session',
        sendOne: 'Send one request',
        sendBurst: (count) => `Send burst ×${count}`,
        stop: 'Stop',
        reset: 'Reset session',
        initialMessage: 'Create a session to begin.',
        sessionCreated: (limit, windowSeconds) =>
          `Session created: ${limit} requests per ${windowSeconds} seconds.`,
        apiUnavailable: 'API is unavailable. Start the backend and Redis, then retry.',
        burstStopped: 'Burst stopped.',
        sessionExpired: 'Session expired or was reset. Create a new session.',
        serviceQuotaExceeded: 'Service quota exceeded. Try again shortly.',
        createFailedFallback: 'Could not create a session.',
        requestFailed: 'Request failed. Check the API connection.',
        stoppingBurst: 'Stopping burst after the current request...',
        sessionReset: 'Session reset. Create a new session.',
        resetFailed: 'Could not reset the session.',
        sessionActive: 'Session active',
        sessionLimitSummary: (limit, windowSeconds) =>
          `Limit: ${limit} requests / ${windowSeconds} seconds`,
        historyHeading: 'Request history',
        historyShowing: (visible, total, max) => `Showing ${visible} / ${total} (max ${max})`,
        awaitingActivity: '$ Awaiting request activity…',
        remaining: 'remaining',
        retryIn: (seconds) => `retry ${seconds}s`,
        accepted: 'accepted',
        serviceQuota: 'Service quota',
        demoQuota: 'Demo quota',
      },
      sqlPlayground: {
        eyebrow: 'Isolated database demo',
        heading: 'SQL injection sandbox',
        description:
          'Compare a deliberately unsafe concatenated query with a parameterized query. The demo database contains fictional data, uses a read-only role, and never accepts arbitrary SQL.',
        modeAria: 'SQL mode',
        unsafeOption: 'Unsafe: string concatenation',
        safeOption: 'Safe: parameterized $1',
        inputPlaceholder: 'Username or payload',
        runQuery: 'Run query',
        presets: [
          { label: 'OR 1=1', value: "' OR '1'='1' --" },
          { label: 'Comment', value: "admin' --" },
          { label: 'Drop attempt', value: "'; DROP TABLE demo.users; --" },
          { label: 'Normal user', value: 'alice' },
        ],
        rejectedFallback: 'The SQL sandbox rejected the request.',
        unavailable: 'The SQL sandbox is unavailable. Check the API connection.',
        noRows: 'No rows matched.',
        colId: 'ID',
        colUsername: 'Username',
        colRole: 'Role',
      },
    },
  },
  vi: {
    brandSuffix: 'BACKEND',
    nav: {
      about: 'Giới thiệu',
      experience: 'Kinh nghiệm',
      skills: 'Kỹ năng',
      education: 'Học vấn',
      playground: 'Demo API',
      projects: 'Dự án',
      contact: 'Liên hệ',
    },
    hero: {
      status: 'Sẵn sàng làm việc · Tìm kiếm cơ hội Backend & Cloud',
      eyebrow: 'Portfolio 2026 · Kỹ sư Phần mềm',
      greeting: 'Xin chào, tôi là Hồ Sỹ Phúc.',
      subtitle: 'Lập trình viên Backend · AWS Cloud · WordPress & Công cụ AI',
      intro:
        'Sinh viên ngành Kỹ thuật Phần mềm tại Đại học Văn Lang với kinh nghiệm thực chiến về hệ thống Backend (Node.js/NestJS, PostgreSQL, Redis), kiến trúc đám mây AWS từ kỳ thực tập tại AWS First Cloud Journey, xây dựng web với WordPress/Elementor và ứng dụng thành thạo các công cụ AI / AI Agent hiện đại.',
      ctaResume: '📄 Xem CV / Hồ sơ',
      ctaGithub: 'Trang GitHub ↗',
      ctaProjects: 'Xem dự án ↓',
      quickChips: [
        'Node.js / NestJS',
        'AWS Cloud',
        'Redis & PostgreSQL',
        'WordPress & Elementor',
        'AI Agents',
      ],
    },
    about: {
      eyebrow: 'Câu chuyện của tôi',
      heading: 'Từ xây dựng sản phẩm web đến thiết kế hệ thống Backend & Cloud ổn định.',
      paragraphs: [
        'Tôi là sinh viên chuyên ngành Kỹ thuật Phần mềm tại Đại học Văn Lang (2022–2026), định hướng phát triển chuyên sâu về Backend, kiến trúc Cloud và triển khai sản phẩm web thực tế. Hành trình của tôi bắt đầu từ việc xây dựng các ứng dụng web hoàn chỉnh — từ hệ thống thương mại điện tử PHP/MySQL, website WordPress/Elementor cho đến nền tảng đặt lịch gia sư thời gian thực với Node.js và React.',
        'Trong kỳ thực tập tại AWS First Cloud Journey, tôi đã tiếp cận trực tiếp với kiến trúc đám mây, các dịch vụ Serverless và cơ chế bảo vệ API đa tầng như Rate Limiting trên Amazon API Gateway, Lambda Authorizer và giám sát bằng CloudWatch. Hiện tại, tôi kết hợp tư duy kỹ thuật Backend bài bản cùng khả năng sử dụng thành thạo các công cụ AI / AI Agent để nâng cao tốc độ, chất lượng mã nguồn và độ tin cậy của hệ thống.',
      ],
      traits: [
        'Thiết kế Backend API tin cậy với Node.js, NestJS, Fastify, PostgreSQL & Redis',
        'Kinh nghiệm thực tập kiến trúc đám mây tại AWS First Cloud Journey',
        'Xây dựng và tùy biến website nhanh chóng với WordPress & Elementor',
        'Thành thạo các công cụ AI & AI Agent hiện đại tối ưu hóa quy trình lập trình',
      ],
    },
    experience: {
      eyebrow: 'Kinh nghiệm làm việc',
      heading: 'Hành trình thực chiến về Cloud & Backend.',
      intro:
        'Kinh nghiệm thực tế trong việc xây dựng kiến trúc đám mây, tài liệu workshop kỹ thuật và các cơ chế bảo vệ API.',
      items: [
        {
          period: 'Thực tập · AWS First Cloud Journey',
          role: 'Thực tập sinh Cloud & Backend (Cloud Intern)',
          company: 'AWS First Cloud Journey (FCJ)',
          location: 'TP. Hồ Chí Minh, Việt Nam',
          summary:
            'Tham gia chương trình thực tập AWS First Cloud Journey, tập trung nghiên cứu và triển khai các kiến trúc cloud-native, bảo mật Serverless và quản lý lưu lượng API.',
          details: [
            'Thiết kế và triển khai kiến trúc API Rate Limiting & Throttling đa tầng trên AWS sử dụng Amazon API Gateway, Usage Plans, API Keys kết hợp AWS Lambda Authorizer tùy biến.',
            'Tự động hóa lịch trình điều chỉnh quota bằng Amazon EventBridge và thiết lập Amazon CloudWatch Alarms để giám sát, cảnh báo lưu lượng lỗi HTTP 429.',
            'Xây dựng và xuất bản bộ tài liệu workshop kỹ thuật hoàn chỉnh (Hugo + Amazon S3 / GitHub Pages) hướng dẫn từng bước triển khai bảo vệ API và dọn dẹp tài nguyên AWS.',
            'Thực hành phân quyền IAM theo nguyên tắc đặc quyền tối thiểu (least-privilege), quy trình triển khai serverless và viết tài liệu kỹ thuật trong môi trường cloud thực tế.',
          ],
        },
      ],
    },
    skills: {
      eyebrow: 'Kỹ năng & Công cụ',
      heading: 'Các công nghệ và công cụ tôi sử dụng thành thạo.',
      intro:
        'Bộ kỹ năng kết hợp giữa kỹ thuật Backend chuyên sâu, hạ tầng AWS Cloud, nền tảng web WordPress và các công cụ AI hiện đại.',
      countLabel: 'kỹ năng',
      groups: [
        {
          category: 'Backend & Lập trình cốt lõi',
          items: [
            'Node.js',
            'TypeScript',
            'NestJS',
            'Fastify',
            'Express',
            'PHP (MVC)',
            'RESTful APIs',
            'Socket.io',
          ],
        },
        {
          category: 'Cơ sở dữ liệu & Bộ nhớ đệm',
          items: [
            'PostgreSQL',
            'MySQL',
            'Redis',
            'Redis Lua Scripts',
            'Transaction Isolation',
            'Tối ưu hóa truy vấn',
          ],
        },
        {
          category: 'Cloud & DevOps',
          items: [
            'AWS API Gateway',
            'AWS Lambda',
            'Amazon S3 & CloudWatch',
            'Amazon EventBridge',
            'Docker & Compose',
            'GitHub Actions (CI/CD)',
            'Render & Vercel',
          ],
        },
        {
          category: 'Web CMS & Công cụ AI',
          items: [
            'WordPress',
            'Elementor',
            'Công cụ AI / AI Agent',
            'Lập trình & Debug cùng AI',
            'Prompt Engineering',
            'Quy trình Agentic AI',
          ],
        },
        {
          category: 'Bảo mật & Kiểm thử',
          items: [
            'API Rate Limiting',
            'Chống SQL Injection',
            'Input Sanitization',
            'Vitest',
            'Unit & E2E Testing',
          ],
        },
      ],
    },
    education: {
      eyebrow: 'Học vấn',
      heading: 'Nền tảng học thuật.',
      items: [
        {
          degree: 'Cử nhân Công nghệ Thông tin / Kỹ thuật Phần mềm',
          school: 'Trường Đại học Văn Lang',
          period: '2022 — 2026',
          description: 'Chuyên ngành Phát triển Phần mềm & Hệ thống Máy tính · GPA: 3.07/4.0.',
          highlights: [
            'GPA: 3.07/4.0 · TP. Hồ Chí Minh, Việt Nam.',
            'Môn học tiêu biểu: Cấu trúc dữ liệu & Giải thuật, Hệ quản trị CSDL, Mạng máy tính, Hệ thống phân tán.',
            'Thực hiện nhiều đồ án và dự án thực tế trải rộng từ Web, Backend đến Cloud.',
          ],
        },
      ],
    },
    platformIntro: {
      eyebrow: 'Về trang web này · Live Backend Sandbox',
      heading: 'Xây dựng API vận hành ổn định ngay cả dưới áp lực cao.',
      description:
        'Portfolio kỹ thuật Backend tập trung vào chuẩn hóa API contract, giới hạn lưu lượng bằng Redis, an toàn truy vấn SQL và bảo mật API.',
      details:
        'Thay vì chỉ liệt kê kỹ năng Backend trên giấy, trang web này kết nối trực tiếp tới một máy chủ API NestJS + Fastify thực tế sử dụng Redis và PostgreSQL. Bạn có thể trực tiếp kiểm thử các thuật toán Rate Limiting nguyên tử và môi trường giả lập SQL Injection ngay bên dưới.',
      badges: [
        'NestJS + Fastify',
        'Redis Lua Quotas',
        'PostgreSQL Role chỉ đọc',
        'Kiểm thử trực tiếp',
      ],
    },
    projects: {
      eyebrow: 'Sản phẩm & Hệ thống',
      heading: 'Các dự án tiêu biểu & gần đây.',
      featuredBadge: '★ Dự án nổi bật',
      sourceCode: 'Mã nguồn ↗',
      livePreview: 'Xem trực tiếp ↗',
      items: [
        {
          title: 'Interactive Backend Portfolio & Security Sandbox',
          tagline: 'Redis Lua Quotas · PostgreSQL SQL Sandbox · Tích hợp Resend',
          description:
            'Hệ thống portfolio Backend tương tác tích hợp các thuật toán giới hạn lưu lượng nguyên tử (Fixed Window & Sliding Window Log), môi trường sandbox thử nghiệm SQL Injection với role chỉ đọc (SELECT-only) và luồng gửi email liên hệ tự động.',
          tags: ['NestJS', 'Fastify', 'Redis', 'PostgreSQL', 'Next.js 16', 'Docker', 'TypeScript'],
          githubUrl: 'https://github.com/PVG341/BackendPortfolio',
          liveUrl: 'https://hosyphuc246-portfolio.vercel.app',
          featured: true,
        },
        {
          title: 'AWS API Rate Limiting & Throttling Architecture Workshop',
          tagline: 'API Gateway · Lambda Authorizer · Usage Plans · CloudWatch Alarms',
          description:
            'Workshop kiến trúc đám mây hướng dẫn triển khai kiểm soát lưu lượng và hạn mức API đa tầng trên AWS. Bao gồm cấu hình REST API Gateway throttling, API Keys cùng Usage Plans, Lambda Authorizer tùy biến, lập lịch reset quota bằng EventBridge và cảnh báo lỗi 429 qua CloudWatch.',
          tags: [
            'AWS API Gateway',
            'AWS Lambda',
            'Amazon CloudWatch',
            'EventBridge',
            'Hugo',
            'Cloud Architecture',
          ],
          githubUrl: 'https://github.com/PVG341/API-RateLimit-Workshop',
          liveUrl: 'https://pvg341.github.io/API-RateLimit-Workshop',
          featured: false,
        },
        {
          title: 'Gia Sư Tại Nhà — Nền tảng kết nối Gia sư',
          tagline: 'Chat thời gian thực (Socket.io) · Thanh toán VNPAY · Đặt lịch học',
          description:
            'Nền tảng kết nối học viên với gia sư theo nhu cầu. Tích hợp tìm kiếm và lọc gia sư linh hoạt, quy trình đặt lịch tự động, thanh toán trực tuyến qua cổng VNPAY, nhắn tin thời gian thực bằng Socket.io và hệ thống đánh giá chất lượng.',
          tags: ['Node.js', 'Express', 'React', 'PostgreSQL', 'Socket.io', 'VNPAY', 'Tailwind CSS'],
          githubUrl: 'https://github.com/PVG341/GiaSuTaiNha',
          featured: false,
        },
        {
          title: 'TechStore — Hệ thống Web Thương mại Điện tử',
          tagline: 'Kiến trúc MVC thuần · Quản lý Đơn hàng & Kho · PHPMailer',
          description:
            'Website thương mại điện tử kinh doanh thiết bị công nghệ và gaming gear. Xây dựng bằng PHP thuần theo mô hình MVC chặt chẽ, hỗ trợ quản lý biến thể sản phẩm, giỏ hàng động, mã giảm giá, phân hạng thành viên, gửi email tự động qua PHPMailer và trang quản trị admin.',
          tags: ['PHP', 'MySQL', 'Bootstrap', 'PHPMailer', 'MVC Architecture', 'JavaScript'],
          githubUrl: 'https://github.com/PVG341/DoAn-Web-E-commercial',
          featured: false,
        },
      ],
    },
    contact: {
      eyebrow: 'Liên hệ',
      heading: 'Cùng trao đổi về cơ hội Backend & Web.',
      description:
        'Biểu mẫu này được bảo vệ bởi Rate Limit và Honeypot chống spam. Tin nhắn sẽ được gửi trực tiếp tới hộp thư của tôi qua Resend.',
    },
    ui: {
      apiStatus: {
        label: 'Trạng thái API',
        checking: 'đang kiểm tra',
        ready: 'sẵn sàng',
        offline: 'ngoại tuyến',
        retry: 'Thử lại',
      },
      contactForm: {
        name: 'Họ và tên',
        email: 'Email',
        message: 'Nội dung tin nhắn',
        website: 'Website',
        sending: 'Đang gửi…',
        submit: 'Gửi tin nhắn',
        accepted: 'Đã tiếp nhận tin nhắn. Cảm ơn bạn.',
        tooMany: (seconds) => `Gửi quá nhiều tin nhắn. Vui lòng thử lại sau ${seconds} giây.`,
        failedFallback: 'Không thể gửi tin nhắn lúc này.',
        unavailable: 'Dịch vụ liên hệ tạm ngưng. Vui lòng kiểm tra kết nối API.',
      },
      rateLimit: {
        eyebrow: 'Demo bảo mật trực tiếp',
        heading: 'Sân chơi Rate-limiting (Giới hạn lưu lượng)',
        description:
          'Quan sát session token do server cấp, quyết định nguyên tử bằng Redis Lua, các header hạn mức và phản hồi HTTP 429.',
        limitLabel: 'Giới hạn request (1–20)',
        windowLabel: 'Khung thời gian (1–60 giây)',
        algorithmLabel: 'Thuật toán',
        slidingOption: 'Sliding Window (Cửa sổ trượt)',
        fixedOption: 'Fixed Window (Cửa sổ cố định)',
        burstLabel: 'Số lượng gửi dồn (Burst)',
        requestSingular: 'request',
        requestPlural: 'requests',
        createSession: 'Tạo phiên thử nghiệm',
        sendOne: 'Gửi 1 request',
        sendBurst: (count) => `Gửi dồn ×${count}`,
        stop: 'Dừng lại',
        reset: 'Đặt lại phiên',
        initialMessage: 'Tạo một phiên thử nghiệm để bắt đầu.',
        sessionCreated: (limit, windowSeconds) =>
          `Đã tạo phiên: ${limit} request mỗi ${windowSeconds} giây.`,
        apiUnavailable: 'API không khả dụng. Hãy khởi động backend và Redis rồi thử lại.',
        burstStopped: 'Đã dừng gửi dồn.',
        sessionExpired: 'Phiên đã hết hạn hoặc bị đặt lại. Hãy tạo phiên mới.',
        serviceQuotaExceeded: 'Đã vượt quá hạn mức dịch vụ. Vui lòng thử lại sau ít phút.',
        createFailedFallback: 'Không thể tạo phiên thử nghiệm.',
        requestFailed: 'Gửi request thất bại. Vui lòng kiểm tra kết nối API.',
        stoppingBurst: 'Đang dừng gửi dồn sau request hiện tại...',
        sessionReset: 'Đã đặt lại phiên. Hãy tạo phiên mới.',
        resetFailed: 'Không thể đặt lại phiên.',
        sessionActive: 'Phiên đang hoạt động',
        sessionLimitSummary: (limit, windowSeconds) =>
          `Giới hạn: ${limit} request / ${windowSeconds} giây`,
        historyHeading: 'Lịch sử request',
        historyShowing: (visible, total, max) =>
          `Đang hiển thị ${visible} / ${total} (tối đa ${max})`,
        awaitingActivity: '$ Đang chờ hoạt động request…',
        remaining: 'còn lại',
        retryIn: (seconds) => `thử lại sau ${seconds}s`,
        accepted: 'chấp nhận',
        serviceQuota: 'Hạn mức hệ thống',
        demoQuota: 'Hạn mức demo',
      },
      sqlPlayground: {
        eyebrow: 'Demo cơ sở dữ liệu cô lập',
        heading: 'Sandbox thử nghiệm SQL Injection',
        description:
          'So sánh truy vấn nối chuỗi không an toàn (cố ý) với truy vấn tham số hóa (parameterized query). Cơ sở dữ liệu demo chứa dữ liệu giả lập, chạy bằng quyền chỉ đọc (read-only) và không chấp nhận SQL tùy ý.',
        modeAria: 'Chế độ SQL',
        unsafeOption: 'Không an toàn: nối chuỗi trực tiếp',
        safeOption: 'An toàn: tham số hóa $1',
        inputPlaceholder: 'Tên người dùng hoặc payload',
        runQuery: 'Chạy truy vấn',
        presets: [
          { label: 'OR 1=1', value: "' OR '1'='1' --" },
          { label: 'Comment', value: "admin' --" },
          { label: 'Thử xóa bảng (Drop)', value: "'; DROP TABLE demo.users; --" },
          { label: 'Người dùng thường', value: 'alice' },
        ],
        rejectedFallback: 'SQL sandbox đã từ chối truy vấn này.',
        unavailable: 'SQL sandbox không khả dụng. Vui lòng kiểm tra kết nối API.',
        noRows: 'Không có bản ghi nào khớp.',
        colId: 'ID',
        colUsername: 'Tên người dùng',
        colRole: 'Vai trò',
      },
    },
  },
};
