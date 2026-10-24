import { IconAdjustments, IconSandbox, IconSettings } from "@tabler/icons-react";
import { Breadcrumb, Button, Card, Empty, Separator } from "erxes-ui";
import { PageHeader } from "ui-modules";
import { Link } from "react-router";
import manifest from "../../../erxes.json" with { type: "json" };

const { path } = manifest.ui;

const IDENTITY: [string, string][] = [
  ["Name", manifest.name],
  ["Route", `/${path}`],
  ["Remote", manifest.ui.remote],
  ["API", `:${manifest.api.port}${manifest.api.graphql}`],
  ["Version", manifest.version],
];

export const SettingsPage = () => (
  <div className="eduflow:flex eduflow:h-full eduflow:flex-col">
    <PageHeader>
      <PageHeader.Start>
        <Breadcrumb>
          <Breadcrumb.List className="eduflow:gap-1">
            <Breadcrumb.Item>
              <Button variant="ghost" asChild>
                <Link to={`/${path}/settings`}>
                  <IconSettings />
                  {manifest.title} settings
                </Link>
              </Button>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb>
        <Separator.Inline />
        <PageHeader.FavoriteToggleButton
          breadcrumb={[manifest.title, "settings"]}
          icon="IconSettings"
        />
      </PageHeader.Start>
      <PageHeader.End>
        <Button variant="outline" asChild>
          <Link to={`/${path}`}>
            <IconSandbox />
            Back to {manifest.title}
          </Link>
        </Button>
      </PageHeader.End>
    </PageHeader>
    <div className="eduflow:flex-1 eduflow:overflow-auto">
      <div className="eduflow:mx-auto eduflow:flex eduflow:w-full eduflow:max-w-3xl eduflow:flex-col eduflow:gap-6 eduflow:p-6">
        <Card>
          <Card.Header>
            <Card.Title>General</Card.Title>
            <Card.Description>
              Plugin identity comes from erxes.json; change it there and
              restart.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="eduflow:grid eduflow:grid-cols-[8rem_1fr] eduflow:gap-y-2 eduflow:text-sm">
              {IDENTITY.map(([label, value]) => (
                <div
                  key={label}
                  className="eduflow:contents"
                >
                  <dt className="eduflow:text-muted-foreground">{label}</dt>
                  <dd>
                    <code className="eduflow:rounded eduflow:bg-muted eduflow:px-1.5 eduflow:py-0.5 eduflow:font-mono eduflow:text-xs">
                      {value}
                    </code>
                  </dd>
                </div>
              ))}
            </dl>
          </Card.Content>
        </Card>
        <Card>
          <Card.Header>
            <Card.Title>Your settings</Card.Title>
            <Card.Description>
              Add this plugin's own configuration here: forms with Form from
              erxes-ui, saved through a prefixed mutation.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <Empty>
              <Empty.Header>
                <Empty.Media variant="icon">
                  <IconAdjustments />
                </Empty.Media>
                <Empty.Title>No settings yet</Empty.Title>
                <Empty.Description>
                  Edit ui/src/pages/SettingsPage.tsx to add them.
                </Empty.Description>
              </Empty.Header>
            </Empty>
          </Card.Content>
        </Card>
      </div>
    </div>
  </div>
);
