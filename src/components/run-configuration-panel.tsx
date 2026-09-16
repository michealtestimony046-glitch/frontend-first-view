import { useMemo, useState } from "react";
import { Check, LockKeyhole, Play } from "lucide-react";
import type { V2Scenario, V2Viewport } from "@/lib/api-client";
import type { NetworkProfileType } from "@/lib/network-profiles";

export interface TriggerRunPayload {
  projectId: string;
  environmentId: string;
  scenarioIds: string[];
  viewportIds: string[];
  networkProfiles: Array<"FAST" | "SLOW_3G" | "OFFLINE">;
  roleIds: string[];
}

type Props = {
  projectId: string;
  environmentId: string;
  scenarios: V2Scenario[];
  viewports?: V2Viewport[];
  planLimit?: number;
};

type Choice<T extends string> = { id: T; label: string; detail?: string };

const fallbackViewports: Choice<string>[] = [
  { id: "desktop", label: "Desktop", detail: "1920 × 1080" },
  { id: "tablet", label: "Tablet", detail: "768 × 1024" },
  { id: "mobile", label: "Mobile", detail: "375 × 812" },
];
const networks: Choice<NetworkProfileType>[] = [
  { id: "FAST", label: "Fast", detail: "Wi-Fi / 4G" },
  { id: "SLOW_3G", label: "Slow 3G" },
  { id: "OFFLINE", label: "Offline" },
];
const roles: Choice<string>[] = [
  { id: "guest", label: "Guest" },
  { id: "authenticated", label: "Authenticated User" },
];

export function RunConfigurationPanel({
  projectId,
  environmentId,
  scenarios,
  viewports,
  planLimit = 2,
}: Props) {
  const [scenarioIds, setScenarioIds] = useState<string[]>(() =>
    scenarios.slice(0, Math.min(planLimit, scenarios.length)).map((scenario) => scenario.id),
  );
  const [viewportIds, setViewportIds] = useState<string[]>(() =>
    viewports?.length ? viewports.map((viewport) => viewport.id) : ["desktop"],
  );
  const [networkProfiles, setNetworkProfiles] = useState<NetworkProfileType[]>(["FAST"]);
  const [roleIds, setRoleIds] = useState<string[]>(["guest"]);
  const [startedLocally, setStartedLocally] = useState(false);
  const viewportChoices: Choice<string>[] = viewports?.length
    ? viewports.map((viewport) => ({
        id: viewport.id,
        label: viewport.label,
        detail: `${viewport.width} × ${viewport.height}`,
      }))
    : fallbackViewports;
  const totalExecutions = useMemo(
    () => scenarioIds.length * viewportIds.length * networkProfiles.length * roleIds.length,
    [networkProfiles.length, roleIds.length, scenarioIds.length, viewportIds.length],
  );
  const canStart =
    scenarioIds.length > 0 &&
    viewportIds.length > 0 &&
    networkProfiles.length > 0 &&
    roleIds.length > 0;
  const toggle = <T extends string>(
    value: T,
    selected: T[],
    setSelected: (next: T[]) => void,
    limit?: number,
  ) => {
    if (selected.includes(value)) setSelected(selected.filter((item) => item !== value));
    else if (!limit || selected.length < limit) setSelected([...selected, value]);
  };
  const payload: TriggerRunPayload = {
    projectId,
    environmentId,
    scenarioIds,
    viewportIds,
    networkProfiles,
    roleIds,
  };

  return (
    <section
      className="rounded-xl border border-primary/25 bg-background/40 p-5"
      aria-labelledby="run-configuration-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            Run configuration
          </p>
          <h3 id="run-configuration-title" className="mt-1 font-display text-xl font-semibold">
            Choose your coverage matrix
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Configure the combinations locally before execution is connected.
          </p>
        </div>
        <span className="rounded-full border border-border px-2 py-1 text-[10px] text-muted-foreground">
          {totalExecutions} executions
        </span>
      </div>
      <div className="mt-5 space-y-5">
        <ConfigGroup title="1. Select scenarios" hint={`Plan limit: ${planLimit}`}>
          <div className="space-y-2">
            {scenarios.map((scenario) => {
              const checked = scenarioIds.includes(scenario.id);
              const locked = !checked && scenarioIds.length >= planLimit;
              return (
                <label
                  key={scenario.id}
                  title={locked ? "Upgrade to add more." : undefined}
                  className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${locked ? "cursor-not-allowed border-border/60 opacity-50" : "cursor-pointer border-border hover:border-primary/40"}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={locked}
                    onChange={() => toggle(scenario.id, scenarioIds, setScenarioIds, planLimit)}
                    className="mt-0.5 accent-primary"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{scenario.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {scenario.expectedOutcome}
                    </span>
                  </span>
                  {locked && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <LockKeyhole className="h-3 w-3" /> Upgrade to add more
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </ConfigGroup>
        <ConfigGroup title="2. Matrix dimensions" hint="Select at least one from each group">
          <div className="grid gap-4 md:grid-cols-3">
            <ChoiceGroup
              title="Devices / Viewports"
              choices={viewportChoices}
              selected={viewportIds}
              onToggle={(id) => toggle(id, viewportIds, setViewportIds)}
            />
            <ChoiceGroup
              title="Network conditions"
              choices={networks}
              selected={networkProfiles}
              onToggle={(id) =>
                toggle(id as NetworkProfileType, networkProfiles, setNetworkProfiles)
              }
            />
            <ChoiceGroup
              title="User roles"
              choices={roles}
              selected={roleIds}
              onToggle={(id) => toggle(id, roleIds, setRoleIds)}
            />
          </div>
        </ConfigGroup>
        <div className="sticky bottom-0 rounded-lg border border-primary/30 bg-primary/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Matrix Calculation</p>
              <p className="mt-1 font-mono text-sm text-foreground">
                {scenarioIds.length} Scenarios × {viewportIds.length} Devices ×{" "}
                {networkProfiles.length} Networks × {roleIds.length} Roles ={" "}
                <strong className="text-primary">{totalExecutions} Total Test Executions</strong>
              </p>
            </div>
            <button
              type="button"
              disabled={!canStart}
              onClick={() => setStartedLocally(true)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Play className="h-4 w-4" /> Start Run
            </button>
          </div>
          {startedLocally && (
            <p className="mt-2 text-xs text-primary">
              Configuration saved locally. Execution wiring will be connected in the next step.
            </p>
          )}
          {!canStart && (
            <p className="mt-2 text-xs text-warning">
              Select at least one scenario, device, network, and role to continue.
            </p>
          )}
        </div>
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer text-[11px] text-muted-foreground">
          Preview JSON payload
        </summary>
        <pre className="mt-2 overflow-x-auto rounded-md bg-black/20 p-3 text-[10px] text-muted-foreground">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </details>
    </section>
  );
}
function ConfigGroup({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">{title}</h4>
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </div>
      {children}
    </div>
  );
}
function ChoiceGroup({
  title,
  choices,
  selected,
  onToggle,
}: {
  title: string;
  choices: Choice<string>[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <h5 className="mb-2 text-xs font-semibold text-muted-foreground">{title}</h5>
      <div className="space-y-2">
        {choices.map((choice) => (
          <label key={choice.id} className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(choice.id)}
              onChange={() => onToggle(choice.id)}
              className="mt-0.5 accent-primary"
            />
            <span>
              <span className="block">{choice.label}</span>
              {choice.detail && (
                <span className="block text-[11px] text-muted-foreground">{choice.detail}</span>
              )}
            </span>
            {selected.includes(choice.id) && (
              <Check className="ml-auto mt-0.5 h-3.5 w-3.5 text-primary" />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
