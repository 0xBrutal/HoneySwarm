# HoneySwarm
### Let Them In. Learn Everything.

**An AI-powered adaptive cyber deception and threat intelligence platform.**

HoneySwarm is a cybersecurity project designed to go beyond conventional threat detection. Instead of simply identifying and blocking suspicious activity, it uses adaptive cyber deception to study potentially malicious behaviour in a controlled, isolated environment.

When a visitor demonstrates sufficiently suspicious behaviour, HoneySwarm can silently route that session into a simulated corporate environment. The visitor interacts with fictional applications, files, accounts, and system interfaces, while the platform records activity and converts observed behaviour into actionable threat intelligence for defenders.

---

## 1. Problem Statement

Traditional cybersecurity systems primarily focus on detecting, blocking, and preventing malicious activity. However, identifying an attack does not necessarily reveal an attacker's intentions, techniques, objectives, or next moves.

Conventional honeypots provide visibility into attacker behaviour, but static environments often fail to adapt to evolving techniques, limiting meaningful engagement and intelligence collection.

Organizations need a smarter deception approach that can safely engage suspicious actors, study their behaviour, and transform their interactions into actionable threat intelligence without exposing legitimate users or real infrastructure.

## 2. Our Solution

HoneySwarm introduces an AI-assisted adaptive deception platform that combines behavioural detection, simulated environments, contextual AI interactions, and centralized threat monitoring.

The platform follows three core principles:

- **Detect:** Identify suspicious activity through behavioural analysis and deterministic detection rules.
- **Deceive:** Provide suspicious sessions with a convincing, isolated fictional corporate environment.
- **Learn:** Record interactions, classify observed techniques, and present threat intelligence through a defender dashboard.

The goal is not merely to detect suspicious activity, but to understand what happens after suspicious activity is identified.

## 3. Core Architecture

HoneySwarm is organized around three major components.

### BAIT — The Deception Environment

BAIT provides the simulated corporate environment in which suspicious visitors can interact.

Potential simulated resources include:

- Employee portals and internal dashboards.
- Fictional employee directories and accounts.
- Simulated cloud storage and confidential documents.
- Fake administrative panels and permissions.
- Internal communications and announcements.
- A simulated terminal and fictional filesystem.

The environment is designed to appear like an ordinary corporate application rather than an obvious honeypot.

### BRAIN — The Adaptive AI Engine

BRAIN provides contextual intelligence for interactions within the simulated environment.

Its responsibilities include:

- Interpreting unexpected visitor interactions.
- Generating context-aware simulated responses.
- Maintaining consistency with the fictional environment.
- Supporting adaptive interactions rather than relying exclusively on static responses.
- Falling back to deterministic responses when an AI provider is unavailable.

AI-generated responses are constrained to the simulation. They do not execute commands on the host operating system or access real infrastructure.

### RECORDER — The Threat Intelligence Engine

RECORDER observes and analyzes activity within the deception environment.

Its responsibilities include:

- Recording session events and interaction history.
- Identifying suspicious behaviour patterns.
- Mapping supported observations to MITRE ATT&CK techniques.
- Generating evidence-based threat scores.
- Providing session timelines and investigation data.
- Presenting threat intelligence through the defender dashboard.

MITRE ATT&CK classifications should be supported by recorded evidence rather than unsupported assumptions.

flowchart TB
    subgraph USERS["Application Users"]
        V["Normal Visitor"]
        A["Suspicious Visitor"]
        D["Security Defender"]
    end

    subgraph FRONTEND["Frontend - React + Vite"]
        PUB["Corporate Website"]
        DECOY["Deception Interface"]
        DASH["Defender Dashboard"]
    end

    subgraph BACKEND["Backend - Node.js + Express"]
        SM["Session Manager"]
        DET["Detection Engine"]
        SIM["Simulation Engine"]
        AI["AI Response Engine"]
        REC["Event Recorder"]
        TI["Threat Intelligence Engine"]
    end

    subgraph AI_LAYER["AI Providers"]
        OR["OpenRouter"]
        LM["LM Studio"]
        FB["Rule-Based Fallback"]
    end

    subgraph STORAGE["Data Layer"]
        DB[("SQLite Database")]
    end

    V --> PUB
    A --> PUB
    D --> DASH

    PUB --> SM
    SM --> DET
    DET --> SIM
    SIM --> DECOY
    DECOY --> AI
    AI --> OR
    AI --> LM
    AI --> FB

    SIM --> REC
    AI --> REC
    REC --> DB
    REC --> TI
    TI --> DB
    DB --> DASH

## 4. How It Works

The HoneySwarm workflow follows this sequence:

1. A visitor accesses the application.
2. The backend monitors relevant session behaviour.
3. A detection engine evaluates suspicious activity using predefined rules and behavioural indicators.
4. When sufficient evidence is available, the backend can route the suspicious session into an isolated deception environment.
5. The visitor interacts with simulated corporate resources.
6. The AI engine provides contextual responses where appropriate.
7. The recorder captures interactions and relevant events.
8. The threat intelligence engine analyzes supported behaviour and identifies relevant techniques.
9. Defenders inspect sessions, timelines, and intelligence through the monitoring dashboard.

**Important:** Suspicious behaviour should not automatically result in deception based on a single unusual request. Routing decisions should be evidence-based and controlled by backend detection logic.

flowchart TD
    A["Visitor accesses HoneySwarm"] --> B["Backend Session Manager"]
    B --> C["Behaviour Detection Engine"]
    C --> D{"Suspicious activity?"}

    D -->|No| E["Normal Website Experience"]
    D -->|Insufficient Evidence| F["Continue Monitoring"]
    F --> C
    D -->|Sufficient Evidence| G["Isolated Deception Environment"]

    G --> H["BAIT: Simulated Corporate Environment"]
    H --> I["BRAIN: Adaptive AI Interaction"]
    I --> J["RECORDER: Capture Session Events"]

    J --> K["Threat Analysis Engine"]
    K --> L["MITRE ATT&CK Mapping"]
    K --> M["Evidence-Based Threat Scoring"]

    L --> N["Defender Dashboard"]
    M --> N
    N --> O["Investigation and Threat Intelligence"]

## 5. Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| Frontend | React, Vite | User interface and application development |
| Styling | Tailwind CSS, shadcn/ui | Responsive interface and reusable components |
| UI Libraries | Lucide React, Framer Motion | Icons and animations |
| Visualization | Recharts | Threat intelligence and activity charts |
| Navigation | React Router | Application routing |
| Backend | Node.js, Express.js | Server-side logic and REST APIs |
| Real-time Communication | Socket.IO | Live events and dashboard updates |
| Database | SQLite | Application and event data storage |
| AI Integration | OpenRouter | Cloud-based AI model access |
| Local AI | LM Studio | Local model integration |
| AI Models | Qwen models | Contextual simulated interactions |
| Threat Intelligence | MITRE ATT&CK | Adversary technique classification |
| Version Control | Git, GitHub | Source control and collaboration |

## 6. Security and Isolation

Security is a fundamental requirement of the HoneySwarm architecture.

The deception environment is intended to remain separate from real application infrastructure.

Key design considerations include:

- Backend-controlled session routing and authorization.
- Isolated simulated state for individual visitor sessions.
- No execution of attacker-supplied commands on the host system.
- No access to real production files, accounts, or infrastructure from the simulation engine.
- AI-generated content is validated before it can affect simulated state.
- Event recording does not depend on successful AI responses.
- AI provider failures should not prevent deterministic simulation behaviour.
- API keys and other secrets must be stored in environment variables and excluded from version control.

HoneySwarm is intended for authorized security research, controlled demonstrations, and defensive cybersecurity experimentation.

## 7. Threat Intelligence and MITRE ATT&CK

HoneySwarm uses the MITRE ATT&CK framework as a reference for classifying observed adversarial behaviour.

Examples of techniques that may be identified when supported by evidence include:

| Technique ID | Technique | Example Observation |
|---|---|---|
| T1087 | Account Discovery | Attempts to enumerate simulated accounts |
| T1083 | File and Directory Discovery | Attempts to explore simulated files |
| T1082 | System Information Discovery | Requests for simulated system information |
| T1057 | Process Discovery | Attempts to inspect simulated processes |
| T1016 | System Network Configuration Discovery | Requests for simulated network configuration |

Technique classifications should include supporting event evidence and confidence information. A generic command or request should not automatically be treated as proof of a more advanced attack.

## 8. Defender Dashboard

The defender interface is designed to provide centralized visibility into suspicious sessions and collected intelligence.

Its intended monitoring capabilities include:

- Security overview and activity metrics.
- Active and historical sessions.
- Live event monitoring.
- Session activity timelines.
- Suspicious behaviour classification.
- MITRE ATT&CK technique mapping.
- Evidence-based threat scoring.
- Investigation of individual sessions.
- AI-assisted incident summaries.
- Exportable investigation reports.

Dashboard statistics and visualizations should be derived from recorded application events rather than fabricated demonstration data.

## 9. AI Integration and Reliability

HoneySwarm uses a hybrid approach combining deterministic logic and AI-assisted interactions.

**OpenRouter:** Primary cloud-based AI integration.

**LM Studio:** Local model integration through an OpenAI-compatible API.

**Rule-based fallback:** Provides deterministic responses for known interactions and basic simulated commands when AI services are unavailable.

The AI engine is used to improve contextual interactions, not to make authoritative security decisions. Detection, session routing, event recording, and access control remain backend responsibilities.

flowchart TD
    A["Suspicious Visitor Interaction"] --> B["Simulation Engine"]
    B --> C{"Known simulated interaction?"}

    C -->|Yes| D["Deterministic Response"]
    C -->|No| E["AI Response Engine"]

    E --> F["Try OpenRouter"]
    F --> G{"Provider Available?"}
    G -->|Yes| H["Generate Contextual Response"]
    G -->|No| I["Try LM Studio"]

    I --> J{"Local Model Available?"}
    J -->|Yes| H
    J -->|No| K["Rule-Based Fallback"]

    D --> L["Validate Simulated Response"]
    H --> L
    K --> L

    L --> M["Update Fictional Environment"]
    M --> N["Record Interaction Event"]
    N --> O["Threat Analysis"]
    O --> P["MITRE ATT&CK Classification"]
    O --> Q["Threat Scoring"]
    P --> R["Defender Dashboard"]
    Q --> R

## 10. Project Scope and Limitations

HoneySwarm is developed as a controlled cybersecurity prototype.

Its simulated applications, accounts, documents, terminal, and internal network representations are fictional. It is not intended to provide access to real corporate systems or execute real attacker commands.

The accuracy of threat classifications depends on the available observations and detection rules. AI-generated interpretations may require human review.

The prototype should not be considered a replacement for production intrusion detection, endpoint protection, network monitoring, or incident response systems.

Production deployment would require additional security testing, privacy review, scalability work, monitoring, and operational safeguards.

## 11. Getting Started

### Prerequisites

- Node.js and npm.
- Git.
- A supported browser.
- An AI provider or local LM Studio instance, if AI functionality is enabled.

### Clone the repository

```bash
git clone https://github.com/0xBrutal/HoneySwarm.git
cd HoneySwarm
```

### Install dependencies

Install dependencies in the frontend and backend directories:

```bash
cd frontend
npm install
```

```bash
cd ../backend
npm install
```

### Configure environment variables

Create the required `.env` file in the backend directory according to the project's environment configuration.

Example configuration keys:

```env
PORT=5000
DATABASE_PATH=./database/honeyswarm.db

OPENROUTER_API_KEY=
OPENROUTER_MODEL=

LM_STUDIO_BASE_URL=http://localhost:1234/v1
LM_STUDIO_MODEL=
```

Use the actual variable names defined by the application configuration. Never commit real API keys or secrets.

### Run the application

Start the backend and frontend using the development scripts defined in their respective `package.json` files.

The exact commands and required configuration depend on the final repository implementation.

## 12. Future Scope

Potential improvements include:

- More advanced behavioural detection and anomaly analysis.
- Additional simulated corporate applications and services.
- Improved multi-session correlation.
- Expanded MITRE ATT&CK coverage.
- More sophisticated AI-driven deception strategies.
- Enhanced threat visualization and investigation workflows.
- Scalable deployment and centralized management.
- Additional reporting and integration capabilities.

## 13. Project Vision

HoneySwarm explores a different approach to cybersecurity.

Instead of focusing exclusively on keeping attackers out, it investigates how controlled deception can reveal what suspicious actors attempt to do, what resources they seek, and which techniques they demonstrate.

**Detect the behaviour. Control the environment. Understand the threat.**

### HoneySwarm — Let Them In. Learn Everything.
