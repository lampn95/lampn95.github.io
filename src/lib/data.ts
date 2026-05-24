export type Experience = {
  company: string;
  role: string;
  location: string;
  period: string;
  accent: string;
};

export const experiences: Experience[] = [
  {
    company: "NVIDIA",
    role: "Senior Software Engineer",
    location: "Vietnam",
    period: "Dec 2025 — Present",
    accent: "from-emerald-400 to-lime-400",
  },
  {
    company: "TikTok",
    role: "Senior Software Engineer — Backend",
    location: "Singapore",
    period: "Nov 2023 — Mar 2025",
    accent: "from-pink-400 to-rose-400",
  },
  {
    company: "Grab",
    role: "Senior Software Engineer — Backend",
    location: "Singapore",
    period: "Sep 2022 — Aug 2023",
    accent: "from-green-400 to-emerald-400",
  },
  {
    company: "TikTok",
    role: "Software Engineer — Backend",
    location: "Singapore",
    period: "Oct 2021 — Aug 2022",
    accent: "from-pink-400 to-rose-400",
  },
  {
    company: "Shopee (Sea Group)",
    role: "Software Engineer — Backend",
    location: "Vietnam",
    period: "Sep 2018 — Apr 2021",
    accent: "from-orange-400 to-amber-400",
  },
];

export type Project = {
  name: string;
  period: string;
  summary: string;
  bullets: string[];
  tech: string[];
  github?: string;
};

export const projects: Project[] = [
  {
    name: "Real-time IoT Telemetry Pipeline",
    period: "Apr 2026 — May 2026",
    summary:
      "Real-time IoT heartbeat pipeline sustaining 5k RPS at p99 < 50 ms on a single-node stack.",
    bullets: [
      "Go + Flink + Kafka + ClickHouse pipeline; event-time tumbling windows with t-digest p50/p95/p99 + distinct device counts.",
      "Dual-sinks to ClickHouse ReplacingMergeTree + raw MergeTree; exactly-once via checkpoints + schema-level dedup.",
      "Persistent volumes keep Kafka / ClickHouse / Flink state across restarts; 61% test coverage across 4 Go modules + JUnit.",
      "Distroless non-root images via Docker Compose; GitHub Actions CI (build, lint, end-to-end smoke test per PR).",
    ],
    tech: [
      "Go 1.22",
      "Java 17",
      "Flink 1.18",
      "Kafka 3.7",
      "ClickHouse 24.3",
      "Docker Compose",
      "t-digest",
    ],
    github: "https://github.com/lampn95/counting-stream-with-flink",
  },
  {
    name: "Crawl News System",
    period: "Apr 2026 — May 2026",
    summary:
      "Durable news crawler on Temporal — crash-safe, idempotent, with 3-layer dedup and per-domain circuit breakers.",
    bullets: [
      "Bounded spiral-BFS workflow with HashSet + Redis SETNX + Postgres SHA-256 dedup.",
      "Streaming 4 MiB body cap, gzip + charset auto-detect (Jsoup), content-type gate, tracking-param stripping.",
      "Horizontal worker scaling via Docker Compose replicas.",
      "GitHub Actions CI runs 59 tests (JUnit 5 + Temporal replay) with JaCoCo ≥80% line / ≥60% branch + full-stack smoke job.",
    ],
    tech: [
      "Java 21",
      "Temporal SDK 1.29",
      "Jsoup",
      "Jedis",
      "HikariCP",
      "Postgres 16",
      "Redis 7",
      "Docker Compose",
    ],
    github: "https://github.com/lampn95/crawl-news-system",
  },
  {
    name: "Cache Infra with Binlog-Driven Invalidation",
    period: "Mar 2026 — Apr 2026",
    summary:
      "MySQL → Debezium → Kafka → Redis pipeline keeping cache eventually consistent within ~100 ms of every write.",
    bullets: [
      "Cache-aside reads expose X-Cache: HIT|MISS for observability.",
      "Validated at 4,268 RPS / 256k ops / 0 errors / 89% hit ratio (HIT p99 ≈ 4 ms, MISS p99 ≈ 5 ms).",
      "Custom Java 21 virtual-threads + HdrHistogram load generator splitting latency by HIT vs MISS.",
      "Production-shaped: 5-module Spring Boot packaged as Docker Compose + Kubernetes (Kustomize, HPA, StatefulSets, kind, nginx-ingress).",
      "37 unit/integration tests + 4-job GitHub Actions CI (mvn-verify, kubeconform, compose-lint, e2e smoke).",
    ],
    tech: [
      "Java 21",
      "Spring Boot 3",
      "MySQL 8",
      "Redis 7",
      "Kafka 3.8",
      "Debezium 2.7",
      "Kubernetes",
    ],
    github: "https://github.com/lampn95/caching-infra-with-invalidation",
  },
];

export const skills = {
  Languages: ["Go", "Python", "Java"],
  "Infra & Data": [
    "Kafka",
    "Redis",
    "MySQL",
    "Postgres",
    "MongoDB",
    "ElasticSearch",
    "Hive",
    "Presto",
    "Pika",
  ],
  "Platform & Ops": ["Kubernetes", "Docker", "Grafana", "Datadog", "Kibana", "Linux", "Bash", "Git"],
  "AI tooling": ["Claude", "OpenAI Codex", "Agentic workflows", "Prompt/spec templates"],
};

export const education = {
  school: "The University of Aizu",
  degree: "B.S. in Computer Science",
  location: "Aizu-Wakamatsu, Japan",
  period: "Sep 2016 — Sep 2018",
  note: "MEXT scholarship (Japanese government), 2016.",
};
