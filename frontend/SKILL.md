---
name: Marktetlink-frontend
description: >
  Generates new pages, components, hooks, and features that strictly follow the Marktetlink React frontend
  architecture. Use this skill whenever the user asks to: add a new page, create a component, build a feature,
  wire up an API call, add a route, or implement any new frontend functionality inside the Marktetlink project.
  Also triggers when the user says "create a page for X", "add a component", "implement X in the frontend",
  or "follow the project structure". This skill enforces file placement, naming conventions, Tailwind styling,
  React Query data fetching, Axios API calls, and shadcn/ui component usage so every output fits seamlessly
  into the existing codebase.
---

# Marktetlink Frontend Skill

You are generating code for the **Marktetlink** React + Vite frontend. All output must conform to the rules below. When in doubt, refer to `references/patterns.md` for detailed examples and `templates/` for copy-paste starters.

---

## Stack at a Glance

| Concern | Tool |
|---|---|
| Framework | React 18 + Vite |
| Language | JSX (`.jsx`) — TypeScript only in `vite.config.ts` / `tsconfig.json` |
| Styling | **Tailwind CSS** — no inline styles, no CSS Modules |
| UI Components | **shadcn/ui** (Radix UI primitives) |
| Data Fetching | **React Query (TanStack Query v5)** |
| HTTP Client | **Axios** — centralised instance in `src/utils/apiClient.js` |
| Routing | **react-router-dom v6** |
| State | React Query for server state; `useState` / `useContext` for local/UI state |

---

## File Placement Rules

```
src/
├─ assets/          Static images & icons
├─ components/      Reusable UI primitives and shared widgets
├─ pages/           One file per route; named <PageName>.jsx (PascalCase)
├─ hooks/           Custom hooks; named use<HookName>.js
├─ routes/          Route definitions only – no logic
├─ utils/           apiClient.js, formatters, helpers
└─ App.jsx          Router + global providers
```

**Rules:**
1. **Pages go in `src/pages/`** — one component per file, exported as default.
2. **Components go in `src/components/`** — grouped in subfolders when part of a domain (e.g., `components/checkout/`).
3. **Every API call lives in a custom hook** in `src/hooks/` — never call Axios directly from a page.
4. **All routes are declared in `src/routes/`** — never add `<Route>` tags directly in `App.jsx`.
5. **No business logic in pages** — pages compose hooks + components only.

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Page component | PascalCase + `Page` suffix (optional but preferred) | `OrderHistory.jsx` |
| Component file | PascalCase | `OrderCard.jsx` |
| Hook file | camelCase, `use` prefix | `useOrders.js` |
| Util file | camelCase | `formatCurrency.js` |
| CSS classes | Tailwind utilities only | `className="flex items-center gap-2"` |

---

## API Calls — Axios + React Query

### 1. Axios client (`src/utils/apiClient.js`)
All requests go through the shared client. Do **not** create a second Axios instance.

```js
// src/utils/apiClient.js  (reference — do not recreate)
import axios from 'axios';
const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_URL });
// request interceptor attaches JWT from localStorage
export default apiClient;
```

### 2. Hook pattern
Every data-fetching hook follows this exact shape:

```js
// src/hooks/useOrders.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';

// --- query keys (always define at top of file) ---
export const orderKeys = {
  all: ['orders'],
  list: (filters) => [...orderKeys.all, 'list', filters],
  detail: (id) => [...orderKeys.all, 'detail', id],
};

// --- fetchers (plain async functions, testable) ---
const fetchOrders = async (filters) => {
  const { data } = await apiClient.get('/orders', { params: filters });
  return data;
};

// --- hooks (exported, named) ---
export const useOrders = (filters) =>
  useQuery({ queryKey: orderKeys.list(filters), queryFn: () => fetchOrders(filters) });

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/orders', payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  });
};
```

**Rules:**
- Export query key objects (`xxxKeys`) alongside hooks.
- Fetcher functions are plain `async` functions — not inside the hook body.
- `useMutation` always invalidates relevant queries `onSuccess`.
- Never put `try/catch` inside hooks — let React Query handle errors; show them in the UI via `isError` / `error`.

---

## Page Pattern

Every page follows this exact structure:

```jsx
// src/pages/OrderHistory.jsx
import { useState } from 'react';
import { useOrders } from '../hooks/useOrders';
import OrderCard from '../components/orders/OrderCard';
import { Skeleton } from '../components/ui/skeleton';   // shadcn
import { Alert, AlertDescription } from '../components/ui/alert'; // shadcn

export default function OrderHistory() {
  const [filters, setFilters] = useState({});
  const { data: orders, isLoading, isError, error } = useOrders(filters);

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorAlert message={error.message} />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Order History</h1>
      <div className="grid gap-4">
        {orders?.map((order) => (
          <OrderCard key={order._id} order={order} />
        ))}
      </div>
    </div>
  );
}

// --- private sub-components for this page (if simple) ---
function PageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
    </div>
  );
}

function ErrorAlert({ message }) {
  return (
    <Alert variant="destructive" className="m-6">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
```

**Rules:**
- `export default` on the main page component.
- Loading state uses shadcn `<Skeleton>`.
- Error state uses shadcn `<Alert variant="destructive">`.
- Small private helpers (skeleton, error banner) at the **bottom** of the file — not extracted unless reused.
- Layout wrapper: always `container mx-auto px-4 py-8` as the root div.

---

## Component Pattern

```jsx
// src/components/orders/OrderCard.jsx
import { Badge } from '../ui/badge';           // shadcn
import { Card, CardContent, CardHeader } from '../ui/card'; // shadcn
import { formatCurrency } from '../../utils/formatCurrency';

export default function OrderCard({ order }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <span className="font-medium text-sm text-gray-500">#{order._id.slice(-6).toUpperCase()}</span>
        <StatusBadge status={order.status} />
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">{formatCurrency(order.total)}</p>
      </CardContent>
    </Card>
  );
}

// private helper inside same file when only used here
function StatusBadge({ status }) {
  const variants = { pending: 'outline', completed: 'default', cancelled: 'destructive' };
  return <Badge variant={variants[status] ?? 'outline'}>{status}</Badge>;
}
```

**Rules:**
- Import shadcn components from `../ui/<name>` (already generated in `src/components/ui/`).
- Props are destructured directly in the function signature.
- No prop-types or TypeScript interfaces — plain JSX.
- Compose multiple shadcn primitives rather than hand-rolling equivalent HTML.

---

## Adding a Route

Edit **`src/routes/`** (the existing route definition file — do not modify `App.jsx` directly):

```jsx
// src/routes/index.jsx  — add to existing routes array
import OrderHistory from '../pages/OrderHistory';

// inside the routes array:
{ path: '/orders', element: <OrderHistory /> },
```

If the route needs auth protection, wrap with the existing `<ProtectedRoute>` component:
```jsx
{ path: '/orders', element: <ProtectedRoute><OrderHistory /></ProtectedRoute> },
```

---

## Tailwind Guidelines

- Use **design tokens from the Tailwind config** (e.g., `text-primary`, `bg-card`) over raw colors where possible.
- Responsive: mobile-first — `sm:`, `md:`, `lg:` breakpoints.
- Interactive states: always add `hover:` and `focus-visible:` variants on clickable elements.
- **Never use `style={{}}` inline styles** — if Tailwind can't do it, add a class to `tailwind.config.js`.
- Spacing rhythm: use multiples of 4 (`gap-4`, `p-4`, `mt-8`).

---

## Checklist Before Outputting Code

When generating any new frontend feature, verify:

- [ ] Page file placed in `src/pages/`, component in `src/components/`
- [ ] API calls isolated in a custom hook in `src/hooks/`
- [ ] Hook uses `apiClient` from `src/utils/apiClient.js`
- [ ] Loading state uses `<Skeleton>`; error state uses `<Alert variant="destructive">`
- [ ] Only Tailwind classes for styling (no inline styles)
- [ ] shadcn/ui primitives used for all UI elements (Button, Card, Badge, Dialog, etc.)
- [ ] Route entry added to `src/routes/`
- [ ] No logic in the page component — page composes hooks + components only

---

## Reference Files

- `references/patterns.md` — Extended examples: forms, modals, protected routes, auth context
- `templates/page.jsx` — Blank page template (copy & rename)
- `templates/hook.js` — Blank hook template (copy & rename)
- `templates/component.jsx` — Blank component template (copy & rename)