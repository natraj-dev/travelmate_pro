# TravelMate Pro — Frontend

Premium React + Tailwind CSS frontend for the TravelMate Pro platform, wired
to every backend module: public browsing (hotels/tours/destinations), the
full customer booking journey, AI travel assistant & itinerary generator,
and dedicated dashboards for hotel managers, tour operators, travel agents,
and admins.

## Requirements

- Node.js 18+
- The backend running (see `../backend/README.md`)

## Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env` if your backend isn't on the default `http://localhost:8000`:

```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_MAPS_API_KEY=
```

## Run

```bash
npm run dev
```

Opens at http://localhost:5173. API calls to `/api` and `/uploads` are
proxied to `http://localhost:8000` in development (see `vite.config.js`).

## Build for production

```bash
npm run build
npm run preview   # serve the production build locally to sanity-check it
```

## Design system

The UI uses a custom "premium travel" design language (see
`tailwind.config.js` and `src/styles/index.css`):

- **Palette** — deep ink teal (`#0F3330`) + brass gold (`#BE9B4E`) on a warm
  sand background, evoking a premium travel-agency feel rather than a
  generic SaaS dashboard.
- **Typography** — Fraunces (display serif) for headings, Inter for UI text,
  IBM Plex Mono for reference numbers, prices, and booking codes.
- **Signature motif** — booking confirmations, itineraries, and membership
  cards use a `.ticket` component styled like a boarding pass / luggage tag
  (dashed perforation line), tying the visual language back to travel.

## Project layout

```
src/
  api/            one file per backend module group (auth, hotels, tours, payments, ai, admin…)
  context/        AuthContext (JWT session), NotificationContext (unread badge)
  components/
    layout/        Navbar, Footer, Sidebar, Topbar, DashboardLayout, PublicLayout
    common/         Button/Card/Modal/Table primitives shared across all pages
  routes/         ProtectedRoute (role-gated), GuestRoute
  pages/
    public/         Home, hotel/tour/destination search & details (no login required)
    auth/           Login, Register, Forgot/Reset password, Verify email
    customer/       Booking flow, My Bookings, Wishlist, Itineraries, AI Assistant, Membership
    hotelmanager/   Hotel + room management, booking oversight
    touroperator/   Package + schedule management, guides, bookings
    agent/          Leads, managed customers
    admin/          Users, verifications, destinations, payments, refunds, coupons,
                    reports, analytics, audit logs, settings
    shared/         Profile, account settings, notifications, messages, support —
                    used by every role
```

Routing (`src/App.jsx`) mounts role-specific sections behind
`ProtectedRoute allowedRoles={[...]}`, so a customer can never see admin
routes and vice versa — matching the backend's RBAC exactly.
