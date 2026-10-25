# Edu Flow

![Edu Flow](assets/logo.jpg)

Education workflow plugin for erxes

An erxes plugin that lives outside the erxes monorepo and joins an erxes stack
through Redis service discovery. It targets the **erxes 3.3.2** host contract
with the **3.3.4** shared-library cohort and uses the single-word plugin name
`eduflow` (route `/eduflow`).

| Part   | Path         | Stack                                              | Dev port |
| ------ | ------------ | -------------------------------------------------- | -------- |
| API    | `api`        | Node.js 22 · `startPlugin` · tenant-scoped Mongoose | 3399     |
| UI     | `ui`         | React 18 Module Federation (Rspack) · Tailwind      | 3099     |
| Shared | `erxes.json` | Plugin identity and ports                          | —        |

Requirements: Node.js 22 (see `.nvmrc`) and the same Redis/MongoDB your erxes
deployment uses.

The UI uses erxes's `erxes-ui`/`ui-modules` design system, installed from npm
(`@erxes/ui`, `@erxes/ui-modules`; see
[docs/erxes-integration.md](docs/erxes-integration.md#shared-libraries)). The
host supplies them at runtime via Module Federation singletons — they are
installed only so TypeScript and Rspack can resolve the imports.

## What's in the demo

A role-based Mongolian homework app with its own login screen:

- **Teacher** — dashboard, square photo grid with a blur lightbox, editable
  parent SMS, grade override, an AI lesson-plan builder (structured sections,
  regenerate, quality check, Word export, saved library), PDF/DOC/DOCX
  attachments, and a students overview with editable parent phone numbers.
- **Student** — only their own screen: streak, homework grade, homework list,
  photo upload + AI check, adaptive quiz and a public/private leaderboard
  setting.
- **Parent** — only their own children: completion, homework grade, AI feedback,
  streaks and SMS history.
- **Adaptive quiz** — picks the student's weakest concept, builds five
  questions, raises difficulty after consecutive correct answers, updates
  mastery and keeps the streak.
- **Leaderboard** — ranked by approved homework grade, with student-controlled
  visibility; private students stay visible to teachers and parents only.
- **Light UI** — the login and app surfaces follow a light, airy blue reference
  with responsive cards and a Kahoot-style student quiz.
- **Settings** — profile, SMS preference, language, leaderboard privacy,
  AI/plugin status, demo reset.
- **Seeded demo school** — Сара багш, Ану/Билгүүн/Сарнай, Хатагтай Туяа, 5А
  анги, homework, submissions, lesson plans and weak-concept maps.

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Teacher | `sara.teacher@school.eduflow.local` | `123456` |
| Student | `anu.5a@school.eduflow.local` | `123456` |
| Student | `bilguun.5a@school.eduflow.local` | `123456` |
| Student | `sarnai.5a@school.eduflow.local` | `123456` |
| Parent | `tuya.parent@example.com` | `123456` |

The login is a **plugin-local demo layer**. The erxes user underneath is still
the local owner, so backend permissions are not yet scoped to the demo account.
Real school SSO/role mapping is the next step. The UI enforces separation:
students only fetch their own member ID, parents only their own children.

Photo review and SMS work in demo mode out of the box:
`upload → Gemma/mock check → teacher grade → streak update → parent record`.
Add the provider keys below to switch to the real integrations.

## AI checking: Gemma 4

1. Create a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Add it to `edu-flow/.env`:
   ```ini
   GEMINI_API_KEY=your_key
   GEMMA_MODEL=gemma-4-26b-a4b-it
   ```
3. Restart the plugin API (`npm run dev:api`).

The API sends the uploaded image inline to Gemma 4’s `generateContent`
endpoint, asks for strict JSON (`score`, `feedback`, `strengths`,
`improvements`), and falls back to the deterministic demo checker on errors.
Settings shows whether Gemma is configured. Supported models:
[`gemma-4-31b-it`, `gemma-4-26b-a4b-it`](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api).

## AI lesson plans

`eduflowGenerateLessonPlan` returns structured JSON — goals, measurable
objectives, materials, timed activity stages, children’s participation,
differentiation and assessment. The teacher edits every section, asks for an
improvement (`Сайжруулах`) with instructions such as “add movement”, runs an AI
quality check, saves to the library, or downloads a Word document. No long
unstructured text block, no manual re-typing.

## Parent SMS: Twilio

The SMS dialog is real; without credentials it records a demo delivery.

```ini
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM=+1555... # or an approved alphanumeric sender ID
```

Restart the API. For Mongolia, use an alphanumeric sender ID / registered
sender and check Twilio’s per-country requirements before a pilot. Twilio’s
Mongolia page currently lists **~$0.3541 per outbound SMS** for international
numbers plus carrier/registration costs; confirm the live price in the console.
If sender approval takes too long, a Telegram bot is a faster free alternative
for the same notification record.

## Demo walkthrough

1. Sign in at `http://localhost:3001` as the erxes owner, then open
   `http://localhost:3001/eduflow`.
2. Use a demo account above (or click one of the account cards).
3. Teacher: assign homework, review submissions, approve a lesson plan.
4. Student: upload a notebook photo, then do today's adaptive quiz.
5. Parent: switch child, read AI feedback and queue a dummy SMS.
6. Settings → **Демо reset** restores the school and signs you out.

Reset from the shell if needed:

```sh
docker exec eduflow-mongo mongosh erxes --quiet \
  --eval 'db.getCollectionNames().filter(c=>c.startsWith("eduflow")).forEach(c=>db.getCollection(c).drop())'
```

## Develop

```sh
npm install
cp .env.example .env
npm run dev:api   # registers with the erxes gateway through Redis
npm run dev:ui    # serves http://localhost:3099/remoteEntry.js
```

`check`, `build` and `dev:ui` run `codegen` first, so the generated GraphQL
types always match the printed API schema.

In the erxes checkout `.env`, add the plugin and restart the gateway and
core-api so they pick it up:

```sh
ENABLED_PLUGINS=...,eduflow
```

Then open `http://localhost:3001/eduflow` (settings: `/eduflow/settings`).
Both processes must use the same Redis as erxes; `UI_ENTRY_URL` must be
reachable by the browser, not merely by the API container. Requests reach the
API through the gateway (`/graphql`), which forwards the signed-in user and
tenant. Those headers are not independently authenticated: keep the API on
a private gateway-only network and strip user/tenant headers at public ingress.

## Scripts

| Script            | What it does                                    |
| ----------------- | ----------------------------------------------- |
| `npm run dev:api` | API in watch mode                               |
| `npm run dev:ui`  | UI remote dev server                            |
| `npm run codegen` | Print the API schema, generate UI GraphQL types |
| `npm run build`   | Production build of every part                  |
| `npm run check`   | Type-check every part                           |
| `npm run lint`    | oxlint                                          |
| `npm run fmt`     | oxfmt                                           |

## Deploy

See [docs/deployment.md](docs/deployment.md) for online MongoDB (Atlas), Redis,
Docker images, public UI hosting, HTTPS and multi-device access.

- **API**: `docker build --build-arg UI_ENTRY_URL=<remoteEntry.js URL> -t <image> .`
  The lockfile is committed, so the image build is reproducible.
  The image serves the API on port 80 and registers itself on start
  (`plugin-eduflow-api:80` unless `LOAD_BALANCER_ADDRESS` is set).
- **UI**: upload `ui/dist` to a static host or CDN. Upload hashed assets
  first and `remoteEntry.js` last with `Cache-Control: no-store`. Without
  `UI_ENTRY_URL`, erxes falls back to `https://plugins.erxes.io/<release>/eduflow_ui/remoteEntry.js`;
  this generator does not upload there. Set your own browser-reachable URL,
  serve all emitted chunks with CORS for the erxes origin, and use immutable
  caching only for content-hashed assets (not stable-named expose chunks).

See [docs/erxes-integration.md](docs/erxes-integration.md) for how the plugin
plugs into erxes and [AGENTS.md](AGENTS.md) for the rules to keep it working.


## Hacktoberfest 2026

Edu Flow is a three-sided learning platform for teachers, students, and parents. We welcome thoughtful contributions to make this shared learning workflow more useful and accessible.

Good places to start include Mongolian translations, accessibility, documentation, demo workflows, and reported bugs. Please open or comment on an issue before starting a larger change, then submit a focused pull request with a clear description. Run `npm run check`, `npm run lint`, and `npm run build` before submitting.

Hacktoberfest 2026 no longer counts pull requests or merge requests toward event rewards. See the [official Hacktoberfest FAQ](https://hacktoberfest.com/questions) for current participation details.
