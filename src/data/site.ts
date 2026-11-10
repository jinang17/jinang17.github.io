// Single source of truth for the content on the site.
// Personal details come from the resume; DevX work from Devxwork.txt.

export const profile = {
  name: 'Jinang Vohera',
  role: 'Software Engineer',
  email: 'jinangsmiles17@gmail.com',
  resume: 'jinang-vohera-resume.pdf',
};

export const typewriterLines = [
  'building commerce platforms at DevX',
  'shipping on AWS with Terraform',
  'tinkering with LLMs and tiny GPTs',
  'solving problems on Codeforces',
];

export const socials = [
  { id: 'github', label: 'GitHub', href: 'https://github.com/jinang17' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/jinang-vohera-a0174920a/' },
  { id: 'mail', label: 'Email', href: 'mailto:jinangsmiles17@gmail.com' },
  { id: 'codeforces', label: 'Codeforces', href: 'https://codeforces.com/profile/jinang17' },
  { id: 'leetcode', label: 'LeetCode', href: 'https://leetcode.com/jinang17/' },
  { id: 'strava', label: 'Strava', href: 'https://www.strava.com/athletes/144822985' },
];

/** Shown in the footer, one at random per visit. Empty = nothing rendered. */
export const quotes: { text: string; author: string }[] = [
  { text: 'Simplicity is prerequisite for reliability.', author: 'Edsger W. Dijkstra' },
  { text: 'Programs must be written for people to read, and only incidentally for machines to execute.', author: 'Harold Abelson' },
  { text: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
];

export interface Role {
  company: string;
  /** Newest first. Rendered as a timeline in the left panel. */
  titles: { title: string; dates: string; note?: string; current?: boolean }[];
  /** Optional links, shown only when filled in. */
  site?: string;
  linkedin?: string;
  /** The first `lead` points are shown; the rest sit behind "Show more". */
  lead: number;
  stack: string[];
  points: string[];
}

export const experience: Role[] = [
  {
    company: 'DevX',
    titles: [
      { title: 'SDE 2', dates: 'Nov 2026 – Present', current: true },
      { title: 'SDE 1', dates: 'Jan 2026 – Nov 2026' },
    ],
    lead: 3,
    stack: ['TypeScript', 'Node.js', 'Medusa v2', 'React 19', 'PostgreSQL', 'AWS', 'Terraform', 'Turborepo'],
    points: [
      'Technical lead on a client-facing retail platform (POS, admin and commerce backend). I set the architecture for a team of three developers, a QA and a PM, and represent engineering in the customer’s daily standups and weekly demos.',
      'Designed the commerce backend as 10 domain modules on Node.js, Medusa v2 and PostgreSQL, and wrote 39% of its 1,000+ commits. Every write is a saga with compensation, resource-creating APIs replay safely through idempotency keys, and a fail-closed RBAC layer enforces 119 permissions scoped per store. It connects Shopify, Pine Labs payments, Strapi CMS and a manufacturing API.',
      'Built the sync pipeline that keeps 620K customers and 440K orders consistent: HMAC-verified webhooks across 19 topics feed SQS with a dead-letter queue, idempotent workers process them, and a transactional outbox handles write-back. Duplicate and out-of-order events heal themselves without locks.',
      'Made reads and exports fast: a denormalised read model serves a product from one row, live inventory is cached for 60 seconds, and exports stream up to 500K rows with resumable keyset pagination.',
      'Shipped the POS (React 19, Vite, Tailwind) with camera barcode scanning and a made-to-measure sizing engine verified at 100% parity across 9,696 rule combinations, plus the admin app on TanStack Query and Zod.',
      'Own the delivery pipeline: both apps on S3 and CloudFront, the API on ECS Fargate with RDS, everything defined in Terraform and deployed by keyless OIDC GitHub Actions, gated by about 590 test files (Jest, Vitest, Playwright, property-based).',
    ],
  },
  {
    company: 'Crest Data Systems',
    titles: [
      { title: 'SDE 1', dates: 'Jul 2024 – Dec 2025', note: 'E1 → E2' },
      { title: 'Software Engineering Intern', dates: 'Jan 2024 – Jun 2024', note: 'E0' },
    ],
    lead: 2,
    stack: ['Python', 'ReactJS', 'Splunk', 'WDIO'],
    points: [
      'Developed features for a Splunk premium application in Python and ReactJS.',
      'Tested it end to end: manual passes, automated suites with the WDIO framework, and smoke tests.',
    ],
  },
  {
    company: 'Carte Blanche Technologies',
    titles: [{ title: 'Software Engineering Intern', dates: 'Jun 2023 – Jul 2023' }],
    lead: 2,
    stack: ['Django', 'IoT'],
    points: [
      'Built a live dashboard that connects to IoT devices and visualises their data in real time.',
      'Structured the Django backend on the model-view-template pattern.',
    ],
  },
];

export const education = {
  school: 'Nirma University',
  detail: 'Institute of Technology, Ahmedabad',
  degree: 'B.Tech, Computer Science and Engineering',
  years: '2020 to 2024',
  score: 'CGPA 7.74',
};

export const achievements = [
  'Runners-up at HackNUthon 4.0 (Athena).',
  'Global rank 330 in the CodeChef December Cook Off.',
  'Global rank 4593 in Google Kickstart 2022; rank 1138 in the Code Jam Farewell round.',
  'Led a team to the finals and semi-finals of the Intra-College Coding Premiere League 1.0 and 2.0.',
];

export const ratings = [
  { site: 'CodeChef', value: '1618' },
  { site: 'LeetCode', value: '1687' },
  { site: 'Codeforces', value: '1563' },
];

export interface Project {
  id: 'brokenomore' | 'cardiology' | 'minigpt';
  name: string;
  stack: string[];
  desc: string;
  repo: string;
}

export const projects: Project[] = [
  {
    id: 'brokenomore',
    name: 'NoMoreBroke',
    stack: ['Python', 'FastAPI', 'Function calling', 'Text-to-SQL', 'SQLAlchemy', 'Langfuse', 'React'],
    desc: 'A personal-finance agent that sends each question to the right one of six financial tools, or to a Text-to-SQL path when none fits. That path is sandboxed: the user id is bound on the server and every query must pass an allowlist, which shuts the door on injection. Memory carries across sessions, and Langfuse traces showed exactly where routing went wrong. Fixing those cases lifted routing precision from 40% to 90%.',
    repo: 'https://github.com/jinang17/NoMoreBroke',
  },
  {
    id: 'cardiology',
    name: 'CardioLLM',
    stack: ['QLoRA', 'PEFT', 'TRL', 'Hugging Face', 'BitsAndBytes', 'PyTorch'],
    desc: 'Fine-tuned Phi-3.5-mini (3.8B) on 2,000 cardiology multiple-choice questions with 4-bit QLoRA, training on chain-of-thought rationales instead of bare answers. A sweep of 12 adapter configurations found one that raises Top-2 accuracy by 2.6 points and cuts positional bias, the habit of favouring certain answer slots, from 7.3% to 2.7%.',
    repo: 'https://github.com/jinang17/CardioLLM',
  },
  {
    id: 'minigpt',
    name: 'smallGPT',
    stack: ['Python', 'PyTorch'],
    desc: 'A character-level GPT written from scratch in PyTorch and trained on Tiny Shakespeare: six transformer blocks, eight-head causal self-attention, 256-dimensional embeddings and a 256-character context. A bigram baseline comes first, so you can see what attention adds. Built to understand every step of the forward pass before leaning on libraries that hide it.',
    repo: 'https://github.com/jinang17/smallGPT',
  },
];

export const earlierProjects = [
  {
    name: 'InterConnect X',
    note: 'Hackathon-winning Django middleware for two-way REST and SOAP integration between separate systems.',
    href: 'https://github.com/jinang17/InterConnectX',
  },
  {
    name: 'PDF Talker',
    note: 'Chat with your PDFs through a local LLM (LangChain and Ollama), so the data never leaves your machine.',
    href: 'https://github.com/jinang17/pdftalker17',
  },
];
