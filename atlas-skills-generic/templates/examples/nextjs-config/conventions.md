# Next.js Web Application Conventions

## Project Overview
- Name: Next.js Web App
- Stack: Next.js 14 (App Router), TypeScript, Tailwind CSS, React Query
- Architecture: Server Components by default, Client Components when needed

## Code Style
- Follow Airbnb JavaScript/TypeScript style guide
- Prettier for formatting (line length: 100)
- ESLint with Next.js config
- Strict TypeScript mode enabled

## Naming Conventions
- Pages/Routes: kebab-case folders (e.g., `user-profile/page.tsx`, `blog-posts/page.tsx`)
- Components: PascalCase (e.g., `UserCard.tsx`, `BlogPostList.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`, `validateEmail.ts`)
- API routes: kebab-case (e.g., `user-data/route.ts`, `blog-posts/route.ts`)
- Hooks: camelCase with 'use' prefix (e.g., `useUserData.ts`, `useBlogPosts.ts`)
- Types: PascalCase (e.g., `User`, `BlogPost`, `ApiResponse`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`, `MAX_PAGE_SIZE`)

## Project Structure
```
src/
  app/                  # App router pages
    (auth)/             # Route groups
      login/
        page.tsx
      register/
        page.tsx
    api/                # API routes
      users/
        route.ts
    page.tsx            # Home page
    layout.tsx          # Root layout
    loading.tsx         # Loading UI
    error.tsx           # Error UI
  components/           # React components
    ui/                 # Reusable UI components
    features/           # Feature-specific components
  lib/                  # Utilities and helpers
    api.ts              # API client
    utils.ts            # Utility functions
  hooks/                # Custom React hooks
  styles/               # Global styles
    globals.css
  types/                # TypeScript types
  constants/            # App-wide constants
```

## Routing (App Router)
- Use App Router (not Pages Router)
- Server Components by default
- Client Components: Add 'use client' only when needed (hooks, browser APIs, interactivity)
- Dynamic routes: `[id]/page.tsx`
- Route groups: `(group-name)/` for organization without affecting URL
- Parallel routes: `@slot/` for advanced layouts

## Data Fetching

### Server Components (Default)
```tsx
// Direct database/API calls in Server Components
import { db } from '@/lib/db';

export default async function UserPage({ params }: { params: { id: string } }) {
  const user = await db.user.findUnique({ where: { id: params.id } });

  return <UserProfile user={user} />;
}
```

### Client Components
```tsx
'use client';

import { useQuery } from '@tanstack/react-query';

export function UserPosts({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['posts', userId],
    queryFn: () => fetch(`/api/posts?userId=${userId}`).then(res => res.json())
  });

  if (isLoading) return <Spinner />;
  return <PostList posts={data} />;
}
```

## State Management
- Server state: React Query (TanStack Query)
- Client state: Zustand for global state
- URL state: Next.js router (useRouter, useSearchParams)
- Form state: React Hook Form
- Anti-pattern: Using Context for server state (use React Query instead)

## Styling
- Framework: Tailwind CSS
- Custom styles: CSS modules for component-specific styles
- Global styles: globals.css for resets and base styles
- Dark mode: CSS variables + next-themes
- Responsive: Mobile-first approach with Tailwind breakpoints

Tailwind config customization:
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
      },
    },
  },
};
```

## Components

### Server Components (Default)
- Use for static content, data fetching, layouts
- Can import Client Components
- Cannot use hooks or browser APIs
- Better performance (less JavaScript sent to client)

### Client Components ('use client')
- Required for: useState, useEffect, event handlers, browser APIs
- Keep as small as possible
- Import Server Components as props, not directly

## Performance Optimization

### Images
```tsx
import Image from 'next/image';

<Image
  src="/profile.jpg"
  alt="Profile"
  width={200}
  height={200}
  priority  // For above-the-fold images
/>
```

### Fonts
```tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

### Code Splitting
```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false  // Disable server-side rendering if not needed
});
```

### Caching & Revalidation
```tsx
// Revalidate every 60 seconds
export const revalidate = 60;

// Or use fetch with revalidation
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 }
});

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic';
```

## API Routes
- Use Route Handlers in app/api/
- Return Response objects
- Support GET, POST, PUT, DELETE, PATCH
- Use NextRequest for type-safe request handling

```tsx
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page') || '1';

  const users = await db.user.findMany({
    skip: (Number(page) - 1) * 10,
    take: 10,
  });

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const user = await db.user.create({
    data: body,
  });

  return NextResponse.json({ user }, { status: 201 });
}
```

## Error Handling
- Use error.tsx for error boundaries
- Use not-found.tsx for 404 pages
- API errors: Return appropriate HTTP status codes
- Client errors: Use ErrorBoundary or react-error-boundary

```tsx
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

## TypeScript
- Strict mode enabled
- Define types in types/ directory
- Use interfaces for objects, types for unions/primitives
- Avoid `any` (use `unknown` if necessary)
- Props: Use type or interface

```tsx
// Good
interface UserCardProps {
  user: User;
  onSelect?: (id: string) => void;
}

export function UserCard({ user, onSelect }: UserCardProps) {
  // ...
}
```

## Testing
- Framework: Jest + React Testing Library
- E2E: Playwright
- Coverage: 75% minimum
- Test files: `*.test.tsx` or `*.spec.tsx` next to component
- Mock API calls with MSW (Mock Service Worker)

```tsx
// UserCard.test.tsx
import { render, screen } from '@testing-library/react';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  it('renders user name', () => {
    const user = { id: '1', name: 'John Doe' };
    render(<UserCard user={user} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

## SEO & Metadata
- Use Metadata API for all pages
- Define metadata in page.tsx or layout.tsx
- Use generateMetadata for dynamic metadata

```tsx
// Static metadata
export const metadata: Metadata = {
  title: 'User Profile',
  description: 'View and edit your profile',
};

// Dynamic metadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const user = await db.user.findUnique({ where: { id: params.id } });

  return {
    title: user.name,
    description: `Profile page for ${user.name}`,
    openGraph: {
      images: [user.avatar],
    },
  };
}
```

## Environment Variables
- Client-side: Prefix with `NEXT_PUBLIC_`
- Server-side: No prefix needed
- Use .env.local for local development
- Use .env.production for production

```bash
# .env.local
DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Deployment
- Changelog file: `CHANGELOG.md` in root
- Version bumping: npm version [patch|minor|major]
- Build command: `npm run build`
- Start command: `npm start`
- Deployment: Vercel (recommended), or Docker + Node.js server

## Pre-Deployment Checklist
- [ ] Run tests: `npm test`
- [ ] Run type checking: `npm run type-check`
- [ ] Run linting: `npm run lint`
- [ ] Build successfully: `npm run build`
- [ ] Check bundle size: Analyze with @next/bundle-analyzer
- [ ] Update CHANGELOG.md
- [ ] Test in production mode locally

## Anti-Patterns (AVOID)

### Using Client Components Unnecessarily
- ❌ Adding 'use client' to components that don't need it
- ✅ Keep Server Components by default, use 'use client' only when needed

### Fetching Data in Client Components
- ❌ Using useEffect to fetch data in Client Components
- ✅ Use React Query or Server Components for data fetching

### Not Optimizing Images
- ❌ Using `<img>` tag directly
- ✅ Use Next.js `<Image>` component

### Ignoring Caching
- ❌ Not setting revalidation strategies
- ✅ Set appropriate revalidate times or use on-demand revalidation

### Using Context for Server State
- ❌ Creating Context for API data
- ✅ Use React Query for server state

### Hardcoded URLs
- ❌ Hardcoding API URLs: `fetch('http://localhost:3000/api/users')`
- ✅ Use environment variables: `fetch(process.env.NEXT_PUBLIC_API_URL + '/users')`

## Accessibility
- All interactive elements have accessible names
- Semantic HTML (use proper heading hierarchy)
- Keyboard navigation support
- ARIA attributes when necessary
- Color contrast minimum 4.5:1
- Test with screen readers

## Security
- Validate all user input (client and server)
- Use CSRF protection (built into Next.js API routes)
- Sanitize HTML content (use DOMPurify)
- Store sensitive data server-side only
- Use HTTPS in production
- Set security headers in next.config.js

```js
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};
```

## Quality Gates
- Linting: `npm run lint` (must pass)
- Type checking: `npm run type-check` (must pass)
- Testing: `npm test` (75% coverage minimum)
- Build: `npm run build` (must succeed)
- Bundle size: Monitor with bundle analyzer

## Examples

### Good Example: Server Component with Client Component
```tsx
// app/users/[id]/page.tsx (Server Component)
import { db } from '@/lib/db';
import { UserProfile } from './UserProfile';

export default async function UserPage({ params }: { params: { id: string } }) {
  const user = await db.user.findUnique({ where: { id: params.id } });
  const posts = await db.post.findMany({ where: { userId: params.id } });

  return (
    <div>
      <UserProfile user={user} posts={posts} />
    </div>
  );
}

// app/users/[id]/UserProfile.tsx (Client Component)
'use client';

import { useState } from 'react';

export function UserProfile({ user, posts }) {
  const [selectedPost, setSelectedPost] = useState(null);

  return (
    <div>
      <h1>{user.name}</h1>
      <PostList posts={posts} onSelect={setSelectedPost} />
      {selectedPost && <PostDetail post={selectedPost} />}
    </div>
  );
}
```

### Good Example: React Query Usage
```tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function UserPosts({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', userId],
    queryFn: async () => {
      const res = await fetch(`/api/posts?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      return res.json();
    },
  });

  const createPost = useMutation({
    mutationFn: async (newPost: NewPost) => {
      const res = await fetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify(newPost),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', userId] });
    },
  });

  return (
    <div>
      {isLoading ? <Spinner /> : <PostList posts={posts} />}
      <CreatePostForm onSubmit={createPost.mutate} />
    </div>
  );
}
```

### Bad Example: Client Component Overuse
```tsx
// ❌ WRONG: Making entire page a Client Component unnecessarily
'use client';

import { useState } from 'react';

export default function UserPage({ params }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${params.id}`)
      .then(res => res.json())
      .then(setUser);
  }, [params.id]);

  if (!user) return <Spinner />;
  return <UserProfile user={user} />;
}

// ✅ CORRECT: Server Component for data, Client Component for interactivity
// See "Good Example: Server Component with Client Component" above
```
