# Matrix QA V2 frontend handoff

## Purpose

The V2 frontend should make the product feel application-aware. The user should not see a generic New Test Run form that implies Matrix QA already knows the target. The experience should guide the user through discovery, review, approval, execution, and evidence-backed reporting.

## Existing V1 surfaces to preserve

Keep the existing authenticated shell, organization switcher, project/run navigation, credits page, notifications, staff/admin controls, settings, avatar behavior, and cross-account browser-state cleanup. Existing V1 runs and reports must remain readable while V2 data is introduced.

## V2 navigation concepts

Add the following project-scoped concepts progressively: Discover, Features, Journey Graph, Test Plans, and Runs. Do not remove the existing Projects or Runs pages until the new plan flow is production-verified.

## First V2 flow

```text
Project → Discover → review project map → choose test mode → review scenarios and risk blocks → approve → run → report
```

The first modes should be Scan only, Quick Smoke, and Standard Adaptive. Deep Matrix and broad cross-browser/device combinations remain later capabilities.

## Required run states in the UI

Use explicit labels such as `Discovering`, `Plan ready`, `Awaiting approval`, `Running`, `Execution complete`, `Processing report`, `Video processing`, `Report ready`, `Partial success`, `Blocked by policy`, `Needs human review`, and `Failed`. Do not collapse blocked, skipped, or artifact-processing states into a generic green completion label.

## Report requirements

The first viewport of a report should answer what was planned, what was executed, what passed, what failed, what was blocked, what was skipped, and what remains untested. Evidence should be one click away. Developer details can include locator evidence, console/network logs, traces, raw video, processed video, confidence, root-cause signals, and a repair package.

## Validation commands

```bash
yarn build
```

For browser QA, test a no-project account, a project with a stable target, a target with layout drift, a blocked dangerous action, a failed artifact processor, and a separate organization. Confirm that no organization/project/run data crosses accounts and that the UI never displays an unrelated target URL.

## Handoff rule

Implement UI only after the backend contract for the corresponding phase exists. Every UI phase must have loading, empty, blocked, failure, and success states. Keep public version labels separate from internal stage labels; display the public release version and expose internal build/commit information under system details.
