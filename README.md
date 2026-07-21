# Matrix QA — Core Testing Platform

This is the frontend for Matrix QA, a core testing and quality assurance platform built with modern web technologies.

## Getting Started

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

## Tech Stack

- **Framework**: React 19
- **Routing**: TanStack Router
- **Data Fetching**: TanStack React Query
- **State Management**: TanStack React Router Context
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **Server**: TanStack React Start with Nitro
- **Build Tool**: Vite
- **Language**: TypeScript

## Project Structure

```
src/
├── routes/          # TanStack Router route definitions
├── components/      # Reusable React components
├── hooks/          # Custom React hooks
├── lib/            # Utilities and helpers
├── server.ts       # Server entry point
├── start.ts        # TanStack Start configuration
├── router.tsx      # Router setup
└── styles.css      # Global styles
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
