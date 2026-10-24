import { useQuery } from "@apollo/client";
import type { ComponentType, ReactNode } from "react";
import {
  IconBook,
  IconDatabase,
  IconExternalLink,
  IconLayoutDashboard,
  IconSandbox,
  IconSettings,
} from "@tabler/icons-react";
// Root imports on purpose: core-ui shares `erxes-ui`/`ui-modules` as Module
// Federation singletons keyed on the bare specifier, so deep imports would
// bundle second private copies instead of reusing the host's.
import {
  Badge,
  Breadcrumb,
  Button,
  Card,
  Separator,
  Skeleton,
  cn,
} from "erxes-ui";
import { PageHeader } from "ui-modules";
import { Link } from "react-router";
import manifest from "../../../erxes.json" with { type: "json" };
import { STATUS_QUERY } from "../graphql";
import { Samples } from "../Samples";

const { path } = manifest.ui;

const Dot = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "eduflow:inline-block eduflow:size-2 eduflow:rounded-full",
      className,
    )}
  />
);

const StatusRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="eduflow:flex eduflow:items-center eduflow:justify-between eduflow:gap-4 eduflow:text-sm">
    <span className="eduflow:text-muted-foreground">{label}</span>
    <span className="eduflow:flex eduflow:items-center eduflow:gap-2 eduflow:font-medium">
      {children}
    </span>
  </div>
);

const ConnectionCard = () => {
  const { data, loading, error, refetch } = useQuery(STATUS_QUERY);
  const status = data?.eduflowStatus;

  const pending = (
    <>
      <Dot className="eduflow:animate-pulse eduflow:bg-muted-foreground" />
      <Skeleton className="eduflow:h-4 eduflow:w-24" />
    </>
  );

  return (
    <Card className="eduflow:w-full eduflow:md:w-80 eduflow:shrink-0">
      <Card.Header>
        <Card.Title className="eduflow:text-sm">Connection</Card.Title>
        <Card.Description>
          Live status of this plugin inside erxes
        </Card.Description>
      </Card.Header>
      <Card.Content className="eduflow:flex eduflow:flex-col eduflow:gap-3">
        <StatusRow label="API">
          {loading ? (
            pending
          ) : error ? (
            <>
              <Dot className="eduflow:bg-destructive" />
              <span>Unreachable</span>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </>
          ) : (
            <>
              <Dot className="eduflow:bg-success" />
              <span>Connected · v{status?.version}</span>
            </>
          )}
        </StatusRow>
        <StatusRow label="Gateway">
          {loading ? (
            pending
          ) : error ? (
            <>
              <Dot className="eduflow:bg-destructive" />
              <span
                className="eduflow:truncate eduflow:max-w-40"
                title={error.message}
              >
                {error.message}
              </span>
            </>
          ) : (
            <>
              <Dot className="eduflow:bg-success" />
              <span>Federated as {status?.plugin}</span>
            </>
          )}
        </StatusRow>
        <StatusRow label="Tenant">
          {loading ? pending : (status?.subdomain ?? "—")}
        </StatusRow>
        <StatusRow label="Signed in">
          {loading
            ? pending
            : (status && (status.userEmail ?? status.userId ?? "Anonymous")) ||
              "—"}
        </StatusRow>
      </Card.Content>
    </Card>
  );
};

const StepCard = ({
  icon: Icon,
  title,
  description,
  code,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  code: string;
}) => (
  <Card>
    <Card.Header>
      <div className="eduflow:flex eduflow:size-9 eduflow:items-center eduflow:justify-center eduflow:rounded-lg eduflow:bg-accent">
        <Icon className="eduflow:size-5" />
      </div>
      <Card.Title>{title}</Card.Title>
      <Card.Description>{description}</Card.Description>
    </Card.Header>
    <Card.Content>
      <code className="eduflow:rounded eduflow:bg-muted eduflow:px-1.5 eduflow:py-0.5 eduflow:font-mono eduflow:text-xs">
        {code}
      </code>
    </Card.Content>
  </Card>
);

const STEPS = [
  {
    icon: IconDatabase,
    title: "Model your data",
    description:
      "Define the records this plugin owns and expose them on the federated graph.",
    code: "api/src/modules/sample",
  },
  {
    icon: IconLayoutDashboard,
    title: "Build the page",
    description:
      "Replace this overview with your module: lists with RecordTable, forms with Form, details in a Sheet.",
    code: "ui/src/pages/IndexPage.tsx",
  },
];

export const IndexPage = () => (
  <div className="eduflow:flex eduflow:h-full eduflow:flex-col">
    <PageHeader>
      <PageHeader.Start>
        <Breadcrumb>
          <Breadcrumb.List className="eduflow:gap-1">
            <Breadcrumb.Item>
              <Button variant="ghost" asChild>
                <Link to={`/${path}`}>
                  <IconSandbox />
                  {manifest.title}
                </Link>
              </Button>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb>
        <Separator.Inline />
        <PageHeader.FavoriteToggleButton
          breadcrumb={[manifest.title]}
          icon="IconSandbox"
        />
      </PageHeader.Start>
      <PageHeader.End>
        <Button variant="outline" asChild>
          <Link to={`/${path}/settings`}>
            <IconSettings />
            Settings
          </Link>
        </Button>
      </PageHeader.End>
    </PageHeader>
    <div className="eduflow:flex-1 eduflow:overflow-auto">
      <div className="eduflow:mx-auto eduflow:flex eduflow:w-full eduflow:max-w-5xl eduflow:flex-col eduflow:gap-6 eduflow:p-6">
        <section className="eduflow:relative eduflow:overflow-hidden eduflow:rounded-xl eduflow:border eduflow:border-border eduflow:bg-background eduflow:p-8 eduflow:shadow-xs">
          <div
            aria-hidden
            className="eduflow:pointer-events-none eduflow:absolute eduflow:inset-0 eduflow:bg-gradient-to-br eduflow:from-primary/10 eduflow:via-transparent eduflow:to-transparent"
          />
          <div className="eduflow:relative eduflow:flex eduflow:flex-col eduflow:gap-6 eduflow:md:flex-row eduflow:md:items-start eduflow:md:justify-between">
            <div className="eduflow:flex eduflow:max-w-xl eduflow:flex-col eduflow:gap-4">
              <div>
                <Badge variant="info">Plugin · v{manifest.version}</Badge>
              </div>
              <h1 className="eduflow:text-2xl eduflow:font-semibold eduflow:tracking-tight">
                Welcome to {manifest.title}
              </h1>
              <p className="eduflow:text-sm eduflow:leading-relaxed eduflow:text-muted-foreground">
                {manifest.description}
              </p>
              <div className="eduflow:flex eduflow:flex-wrap eduflow:gap-2">
                <Button asChild>
                  <Link to={`/${path}/settings`}>
                    <IconSettings />
                    Open settings
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href="https://erxes.io/docs/create-plugin-standalone"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <IconBook />
                    Developer guide
                    <IconExternalLink />
                  </a>
                </Button>
              </div>
            </div>
            <ConnectionCard />
          </div>
        </section>
        <Samples />
        <div className="eduflow:grid eduflow:gap-4 eduflow:md:grid-cols-2">
          {STEPS.map((step) => (
            <StepCard key={step.title} {...step} />
          ))}
        </div>
      </div>
    </div>
  </div>
);
