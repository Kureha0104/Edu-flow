# Edu Flow

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

- **Teacher** — dashboard, assign homework, review photo submissions with
  mock AI feedback, and move lesson plans through draft → review → approved.
- **Student** — only their own screen: streak/XP/level, homework list, photo
  upload + AI check, and an adaptive quiz.
- **Parent** — only their own children: completion, AI feedback, streaks and a
  dummy SMS inbox.
- **Adaptive quiz** — picks the student's weakest concept, builds five
  questions, raises difficulty after consecutive correct answers, updates
  mastery and awards XP on completion.
- **Settings** — profile, SMS preference, language (Mongolian), demo reset and
  plugin info.
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

Photo review and SMS are simulated but the flow is real:
`upload → AI-style score → teacher approval → streak/XP update → parent record`.
Replace `runMockAi` in [api/src/graphql/schema.ts](api/src/graphql/schema.ts)
with a vision model, and `notifyParent` with Twilio, without changing the
workflow.

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
