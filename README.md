# Doctor Booklet — Doctor Appointment Booking System

A full React + Bootstrap frontend for booking doctor appointments.
Built with enterprise-level folder structure for beginners.

---

## Tech Stack

| Tool | Why We Use It |
|------|--------------|
| React 18 | UI framework — builds the interface from components |
| Vite | Build tool — starts dev server fast, hot reload |
| React Router v6 | URL routing between pages |
| Bootstrap 5 | Responsive grid + pre-built UI components |
| React Bootstrap | Bootstrap components written as React components |
| Axios | HTTP client — calls your Laravel API |
| Swiper | Touch-friendly sliders on home page |

---

## Quick Start

### 1. Prerequisites
Make sure you have installed:
- Node.js v18+ → https://nodejs.org
- Your Laravel API running at `http://127.0.0.1:8000`

### 2. Install dependencies
```bash
cd doctor-booklet
npm install
```

### 3. Start development server
```bash
npm run dev
```
Open http://localhost:5173 in your browser.

### 4. Add hospital images
Create this folder and add images:
```
public/
  images/
    hospitals/
      hospital-1.jpg
      hospital-2.jpg
      hospital-3.jpg
      hospital-4.jpg
      hospital-5.jpg
      hospital-6.jpg
```
Any hospital photos work. If images are missing, colored gradients show as fallback.

### 5. Change API base URL (if needed)
Open `src/api/axiosInstance.js` and update:
```js
baseURL: 'http://127.0.0.1:8000/api'
```

---

## Project Structure Explained

```
src/
│
├── api/                    ← ALL API calls live here only
│   ├── axiosInstance.js    ← Base URL + auth token injected automatically
│   ├── authApi.js          ← login, register
│   ├── doctorApi.js        ← getDoctors, getDoctorById, getSpecialties
│   ├── hospitalApi.js      ← getHospitals, getHospitalById
│   ├── appointmentApi.js   ← create, list, cancel appointments
│   └── locationApi.js      ← getDivisions, getDistricts
│
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx      ← Responsive navbar, auth-aware
│   │   └── Footer.jsx      ← Site footer
│   │
│   ├── common/             ← Reusable pieces used across pages
│   │   ├── DoctorCard.jsx      ← Doctor card (home + doctors page)
│   │   ├── HospitalCard.jsx    ← Hospital card
│   │   ├── SearchFilter.jsx    ← Division→District→Specialty + text
│   │   ├── ProtectedRoute.jsx  ← Redirects to login if not logged in
│   │   ├── ErrorBoundary.jsx   ← Catches React crashes gracefully
│   │   ├── Skeletons.jsx       ← Loading placeholder shapes
│   │   ├── ScrollToTop.jsx     ← Scrolls to top on page change
│   │   └── BackToTop.jsx       ← Floating ↑ button
│   │
│   └── home/               ← Sections used only on HomePage
│       ├── HeroSection.jsx     ← Banner + search bar
│       ├── HospitalSlider.jsx  ← Swiper slider for hospitals
│       ├── DoctorSlider.jsx    ← Swiper slider for doctors
│       └── SpecialtySection.jsx← Specialty icons grid
│
├── context/
│   └── AuthContext.jsx     ← Global login state (user, login, logout)
│
├── hooks/                  ← Reusable data-fetching logic
│   ├── useDoctors.js       ← Fetches doctors with filters
│   ├── useHospitals.js     ← Fetches hospitals
│   └── useLocations.js     ← Fetches divisions + chained districts
│
├── pages/                  ← One file per page/route
│   ├── HomePage.jsx
│   ├── DoctorsPage.jsx
│   ├── DoctorDetailPage.jsx
│   ├── HospitalsPage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── BookAppointmentPage.jsx
│   ├── MyAppointmentsPage.jsx
│   └── ProfilePage.jsx
│
├── assets/images/          ← Static images (doctor photos etc.)
├── App.jsx                 ← All routes defined here
├── main.jsx                ← Entry point, wraps app with providers
└── index.css               ← Global styles and CSS variables
```

---

## Pages & Routes

| URL | Page | Auth Required |
|-----|------|--------------|
| `/` | Home | No |
| `/doctors` | All Doctors | No |
| `/doctors/:id` | Doctor Detail | No |
| `/hospitals` | All Hospitals | No |
| `/login` | Login | No |
| `/register` | Register | No |
| `/book-appointment/:doctorId` | Book Appointment | **Yes** |
| `/my-appointments` | My Appointments | **Yes** |
| `/profile` | Profile | **Yes** |

---

## How Login Works (Important!)

1. User fills login form → `POST /api/login` is called
2. API returns `{ token, user }`
3. Token is saved in `localStorage` (browser memory)
4. `AuthContext` stores the `user` object in React state
5. Every API call automatically adds `Authorization: Bearer <token>`
   — thanks to the Axios interceptor in `axiosInstance.js`
6. When user refreshes the page, `AuthContext` reads the token
   from `localStorage` again so they stay logged in
7. Logout clears `localStorage` and React state

---

## How Search Filtering Works

The search filter uses "chained dropdowns":

1. **Division** dropdown loads from `GET /api/divisions`
2. When Division is selected → **District** loads from `GET /api/districts?division_id=X`
3. **Specialty** loads independently from `GET /api/specialties`
4. **Text search** is a free text input
5. When Search is clicked → params are passed to `GET /api/doctors?division_id=X&district_id=Y&specialty_id=Z&search=text`
6. Results update automatically without page reload

---

## API Response Format Expected

The app handles both formats:
```json
{ "success": true, "data": [...] }
{ "success": true, "data": { "data": [...], "total": 50, "current_page": 1 } }
```

---

## Build for Production

```bash
npm run build
```
Creates a `dist/` folder. Upload this to your web server.

---

## Common Issues

**"CORS error" in browser:**
Add to your Laravel `config/cors.php`:
```php
'allowed_origins' => ['http://localhost:5173'],
```

**"401 Unauthorized" on every request:**
Check that your Laravel API returns a `token` field in the login response.
The app looks for `response.data.token`.

**Sliders not showing:**
Run `npm install` again — Swiper may not have installed correctly.

**Images not showing:**
Add jpg files to `public/images/hospitals/` folder.
The `public/` folder is served directly by Vite.

---

## Development Tips for Beginners

- **Never edit files in `node_modules/`** — they get deleted on reinstall
- **`src/api/` is the only place** that should call `axios` — pages use hooks
- **`src/context/AuthContext.jsx`** is the only place that manages login state
- **To add a new page**: create file in `src/pages/`, add a `<Route>` in `App.jsx`
- **To add a new API call**: add a function in the correct `src/api/` file

---

## Step-by-Step Build Order (What Was Built)

| Step | What | Why First |
|------|------|-----------|
| 1 | API layer + Auth + Navbar | Foundation everything else depends on |
| 2 | Home page + sliders + search | First thing users see |
| 3 | Doctors + Detail + Hospitals + Booking | Core functionality |
| 4 | Skeletons + ErrorBoundary + polish | Makes it feel professional |

---

Built with React + Bootstrap. API by Laravel.
