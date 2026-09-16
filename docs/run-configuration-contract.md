# Run Configuration Contract

The ready-plan UI has one source of truth for matrix selections. The `Start Run` button sends the live selection to the existing authorized plan execution endpoint; discovery and plan approval remain separate phases.

## TypeScript API contract

```ts
export interface TriggerRunPayload {
  projectId: string;
  environmentId: string;
  scenarioIds: string[];
  viewportIds: string[];
  networkProfiles: Array<"FAST" | "SLOW_3G" | "OFFLINE">;
  roleIds: string[];
}
```

The same interface is exported by `src/components/run-configuration-panel.tsx`. The panel owns a single `MatrixSelection` object, exposes the immutable `projectId` and `environmentId` in this payload, and shows a live JSON preview beneath the disclosure. Every array must contain at least one item before execution is enabled; scenario selections remain capped by the plan limit with the explanation `Upgrade to add more.`.

The payload maps to `POST /plans/:planId/run` through `v2Api.runPlan`. The parent preserves the target URL, access mode, vision and recovery capabilities, and authorization confirmation while passing all four matrix arrays without reconstructing or defaulting them. The backend retains plan, project, environment, membership, policy, and capacity checks.

An immediate response with a concrete run ID is routed by the existing `onStarted` flow to the Matrix Execution Ledger using that returned run ID. A provider response with status `WAITING` remains on the preflight view with the existing queue message and does not report a completed start or create a duplicate submission.

## Prisma foundation

The backend already has equivalent production models named `TestScenario`, `ProjectRole`, and `TestPlan`. They are retained rather than introducing duplicate tables. The following blocks show the exact conceptual contract for the requested names and the fields required by this UI state.

```prisma
model Scenario {
  id              String   @id @default(uuid())
  matrixPlanId    String
  name            String
  intent          String
  expectedOutcome String
  steps           Json?
  priority        Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  matrixPlan MatrixPlan @relation(fields: [matrixPlanId], references: [id], onDelete: Cascade)

  @@index([matrixPlanId, priority])
  @@map("test_scenarios")
}

model ProjectRole {
  id              String   @id @default(uuid())
  projectId       String
  environmentId   String
  name            String
  roleType        ProjectRoleType @default(GUEST)
  loginUrl        String
  verificationUrl String
  sessionStatus   ProjectRoleSessionStatus @default(UNVERIFIED)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project     Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  environment Environment @relation(fields: [environmentId], references: [id], onDelete: Cascade)

  @@index([environmentId, sessionStatus])
  @@map("project_roles")
}

model MatrixPlan {
  id            String   @id @default(uuid())
  projectId     String
  environmentId String
  name          String
  planLimit     Int      @default(2)
  scenarioIds   Json
  viewportIds   Json
  networkProfiles Json
  roleIds       Json
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  project     Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  environment Environment @relation(fields: [environmentId], references: [id], onDelete: Cascade)
  scenarios   Scenario[]

  @@index([projectId, environmentId, createdAt])
  @@map("matrix_plans")
}
```

For the current database, map these concepts as follows: `Scenario` is `TestScenario`, `MatrixPlan` is `TestPlan`, and the existing `ProjectRole` is already the production role model. The selected viewport, network, and role arrays are currently represented in the run request and generated `TestCase` records; persistence of a separate `MatrixPlan` snapshot can be added when execution wiring is intentionally enabled.
