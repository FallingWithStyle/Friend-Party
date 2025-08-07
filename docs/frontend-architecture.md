# Friend Party Frontend Architecture Document

## 1. Introduction

This document outlines the frontend architecture for the Friend Party application. It is based on the requirements detailed in the [Product Requirements Document (`docs/prd.md`)](docs/prd.md) and the design specifications in the [UI/UX Specification (`docs/ui-ux-spec.md`)](docs/ui-ux-spec.md). The goal is to create a scalable, maintainable, and performant frontend that aligns with the project's rapid development and deployment goals.

### 1.1. Change Log

| Date | Version | Description | Author |
| :--- | :--- | :--- | :--- |
| 2025-07-13 | 1.0 | Initial Draft | Winston (Architect) |

## 2. Template and Framework Selection

As specified in the PRD, this is a new greenfield project.

*   **Framework Choice**: The PRD recommends **React** with a framework like **Next.js** or **Vite**. We will proceed with **Next.js**.
    *   **Rationale**: Next.js provides a robust, production-ready framework with features like file-based routing, server-side rendering (SSR), static site generation (SSG), and API routes out-of-the-box. This aligns perfectly with the project's need for rapid development and easy deployment to Vercel. The routing and API capabilities will simplify the architecture significantly.
*   **Starter Template**: We will use the official `create-next-app` with TypeScript.
    *   **Rationale**: This provides a clean, up-to-date starting point with all the necessary configurations for a modern React/Next.js application, including TypeScript support, which will be crucial for maintainability.

## 3. Frontend Tech Stack

This technology stack is derived from the recommendations in the PRD and UI/UX Specification.

| Category | Technology | Version | Purpose | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Framework** | Next.js | ^14.2.0 | Primary application framework | Provides routing, SSR, and a complete development environment. Aligns with PRD and Vercel deployment. |
| **Language** | TypeScript | ^5.4.0 | Statically typed JavaScript | Ensures type safety, improves developer experience, and reduces bugs. |
| **UI Library** | React | ^18.3.0 | Core UI rendering library | The foundational library for Next.js and the modern web. |
| **Component Library** | Shadcn/UI | Latest | Accessible & customizable components | As recommended in the UI/UX spec, it offers unstyled, accessible components that we can fully customize to fit our retro theme. |
| **Styling** | Tailwind CSS | ^3.4.0 | Utility-first CSS framework | Integrates seamlessly with Shadcn/UI and allows for rapid, consistent styling. |
| **State Management** | Zustand | ^4.5.0 | Minimalist state management | For simple, global state needs (like user session or party status), Zustand is lightweight and avoids boilerplate compared to Redux or Context API. |
| **Data Fetching** | SWR | ^2.2.0 | React hooks for data fetching | Developed by Vercel, it integrates perfectly with Next.js for caching, revalidation, and real-time updates. |
| **Backend Client** | `@supabase/supabase-js` | ^2.40.0 | Official Supabase client | The official, recommended way to interact with the Supabase backend for auth, data, and real-time subscriptions. |
| **Form Handling** | React Hook Form | ^7.50.0 | Performant form library | Provides a simple, efficient way to manage form state and validation. |
| **Build Tool** | Next.js (Webpack/SWC) | N/A | Bundling and compilation | Handled internally by Next.js for optimized builds. |
| **Testing** | Jest & React Testing Library | Deferred | Unit & Component Testing | Per PRD, testing is deferred post-MVP. These are the industry standards for React. |

## 4. Project Structure

The project will follow a standard Next.js `app` directory structure, organized by feature and domain.

```plaintext
friend-party-app/
├── public/
│   ├── fonts/
│   └── images/
│       └── parchment-texture.jpg
├── src/
│   ├── app/
│   │   ├── (auth)/             # Route group for auth pages (login, etc.)
│   │   ├── (game)/             # Route group for main game flow
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   ├── party/[code]/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx      # Lobby screen
│   │   │   │   ├── questionnaire/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── results/
│   │   │   │       └── page.tsx
│   │   │   └── join/
│   │   │       └── page.tsx
│   │   ├── api/                  # Next.js API Routes (if needed for server-side logic)
│   │   ├── globals.css
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Landing page
│   ├── components/
│   │   ├── common/               # Reusable across multiple features (e.g., Header)
│   │   ├── forms/                # Form-specific components
│   │   ├── ui/                   # Shadcn/UI components (e.g., Button, Card)
│   │   └── game/                 # Components specific to the game flow
│   │       ├── Lobby.tsx
│   │       ├── Questionnaire.tsx
│   │       └── ResultsSheet.tsx
│   ├── lib/
│   │   ├── constants.ts
│   │   ├── types.ts              # Core TypeScript types and interfaces
│   │   └── utils.ts              # General utility functions
│   ├── services/
│   │   └── supabase/
│   │       ├── client.ts         # Supabase client-side instance
│   │       └── server.ts         # Supabase server-side instance
│   ├── store/
│   │   └── partyStore.ts         # Zustand store for party state
│   └── styles/
│       └── fonts.ts              # Font definitions
└── tailwind.config.ts
└── tsconfig.json
```

## 5. Component Standards

Components are the building blocks of the application. They will be functional components using React Hooks.

### 5.1. Component Template

A standard component will look like this, emphasizing clear prop typing and separation of concerns.

```typescript
// src/components/ui/Button.tsx

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

### 5.2. Naming Conventions

*   **Components**: `PascalCase` (e.g., `PartyLobby.tsx`)
*   **Files**: `kebab-case` for pages and routes (e.g., `create-party/page.tsx`), `PascalCase` for components.
*   **Hooks**: `useCamelCase` (e.g., `useParty.ts`)
*   **Types/Interfaces**: `PascalCase` (e.g., `interface PartyMember`)

## 6. State Management

*   **Local State**: Managed with `useState` and `useReducer` for component-level state.
*   **Global State**: Managed with **Zustand**. This will be used for:
    *   The current user's session/authentication status.
    *   The current party state, including members and their status (for real-time updates).
*   **Server Cache State**: Managed with **SWR**. SWR will handle the caching, revalidation, and synchronization of data fetched from the Supabase API.

### 6.1. Store Structure (Zustand)

```typescript
// src/store/partyStore.ts
import { create } from 'zustand';
import type { Party, PartyMember } from '@/lib/types';

interface PartyState {
  party: Party | null;
  members: PartyMember[];
  setParty: (party: Party) => void;
  addMember: (member: PartyMember) => void;
  updateMemberStatus: (memberId: string, status: string) => void;
}

export const usePartyStore = create<PartyState>((set) => ({
  party: null,
  members: [],
  setParty: (party) => set({ party, members: party.members }),
  addMember: (member) => set((state) => ({ members: [...state.members, member] })),
  updateMemberStatus: (memberId, status) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId ? { ...m, status } : m
      ),
    })),
}));
```

## 7. API Integration

All backend communication will be handled through the official `@supabase/supabase-js` client.

### 7.1. Service Layer

We will create a service layer to abstract away the direct Supabase calls from our components. This makes the code cleaner and easier to test.

```typescript
// src/services/supabase/partyService.ts
import { createClient } from '@/services/supabase/client';
import type { PartyCreationRequest } from '@/lib/types';

const supabase = createClient();

export async function createParty(partyData: PartyCreationRequest) {
  // Logic to generate a unique 6-letter code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from('parties')
    .insert([{ ...partyData, code }])
    .select()
    .single();

  if (error) {
    console.error('Error creating party:', error);
    throw new Error('Could not create party.');
  }

  return data;
}

export async function getPartyByCode(code: string) {
  // ... implementation
}
```

### 7.2. API Client Configuration

The Supabase client will be initialized using environment variables, as recommended in the PRD.

```typescript
// src/services/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

## 8. Routing

Routing will be handled by the **Next.js App Router**. The file system-based routing defined in the *Project Structure* section will be the source of truth for all application routes.

### 8.1. Route Protection

Protected routes (those requiring authentication) will be handled using a combination of Next.js Middleware and Route Groups.

```typescript
// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/services/supabase/server';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const { data: { session } } = await supabase.auth.getSession();

  // If user is not logged in and trying to access a protected route
  if (!session && request.nextUrl.pathname.startsWith('/party')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/party/:path*'],
};
```

## 9. Styling Guidelines

As per the UI/UX spec, we will use **Tailwind CSS** with a custom theme to achieve the retro D&D rulebook aesthetic.

### 9.1. Global Theme

The theme will be configured in `tailwind.config.ts`.

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8B0000', // Dark Red
        secondary: '#00008B', // Dark Blue
        accent: '#556B2F', // Dark Olive Green
        background: '#F5DEB3', // Wheat/Parchment
        surface: '#D2B48C', // Tan
        'text-primary': '#3A241D', // Very Dark Brown
        'text-muted': '#6F4E37', // Coffee Brown
        'border-color': '#855E42', // Dark Tan
      },
      fontFamily: {
        heading: ['"IM Fell English SC"', 'serif'],
        body: ['Garamond', 'serif'],
      },
      backgroundImage: {
        'parchment': "url('/images/parchment-texture.jpg')",
      },
    },
  },
  plugins: [],
};
export default config;
```

## 10. Testing Requirements

As per the PRD, all automated testing (unit, integration, E2E) is **deferred** until after the MVP launch to accelerate development. A dedicated testing phase will be required post-launch.

## 11. Environment Configuration

The application will require the following environment variables, stored in a `.env.local` file.

```
# .env.local.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 12. Frontend Developer Standards

### 12.1. Critical Coding Rules
1.  **Type Safety**: All new code MUST be strongly typed. Avoid `any` wherever possible.
2.  **Service Layer**: All direct communication with Supabase MUST be abstracted into the `src/services` layer. Components should not call `supabase.from(...)` directly.
3.  **Environment Variables**: Access environment variables only through a centralized configuration module. Do not use `process.env` directly in components.
4.  **Styling**: Use Tailwind utility classes for all styling. Avoid writing custom CSS files unless absolutely necessary for complex animations or global styles.
5.  **State Management**: Use Zustand for global state and SWR for server state. Avoid prop-drilling.