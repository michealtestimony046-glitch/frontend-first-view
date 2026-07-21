# Matrix QA — Core Testing Platform

This is the frontend for Matrix QA, a core testing and quality assurance platform built with modern web technologies.

## Getting Started

### Development
```bash
bun install
bun run dev
```

### Build
```bash
bun run build
```

### Preview
```bash
bun run preview
```

## Tech Stack

- **Framework**: React 19
- **Routing**: TanStack Router with file-based routing
- **Data Fetching**: TanStack React Query
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form with Zod validation
- **Server**: TanStack React Start with Nitro backend
- **Build Tool**: Vite 8
- **Language**: TypeScript
- **Package Manager**: Bun

## Project Structure

```
src/
├── routes/          # TanStack Router file-based routes
├── components/      # Reusable React components (Radix UI)
├── hooks/          # Custom React hooks
├── lib/            # Utilities, helpers, and mock data
├── server.ts       # Server entry point (Cloudflare Workers compatible)
├── start.ts        # TanStack Start configuration
├── router.tsx      # Router initialization
└── styles.css      # Global Tailwind styles
```

## Scripts

- `bun run dev` - Start development server with HMR
- `bun run build` - Build for production
- `bun run build:dev` - Build in development mode
- `bun run preview` - Preview production build locally
- `bun run lint` - Run ESLint checks
- `bun run format` - Format code with Prettier

## Development Notes

- TanStack Router uses file-based routing in `src/routes/`
- All routes are auto-generated via `src/routeTree.gen.ts`
- Authentication and state management are handled via React Context + React Query
- UI components are built with Radix UI for accessibility
- Styling uses Tailwind CSS with custom token system

## Environment

This project is optimized for deployment on Cloudflare Workers via the Nitro server runtime.
