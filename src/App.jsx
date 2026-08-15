import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AppNavbar     from './components/layout/Navbar'
import Footer        from './components/layout/Footer'
import ProtectedRoute from './components/common/ProtectedRoute'
import ScrollToTop   from './components/common/ScrollToTop'
import BackToTop     from './components/common/BackToTop'
import FloatingBottomNav from './components/layout/FloatingBottomNav'
import ErrorBoundary from './components/common/ErrorBoundary'
import AdminRoute    from './components/admin/AdminRoute'
import AdminLayout   from './components/admin/AdminLayout'
import SubscriptionGate from './components/admin/SubscriptionGate'

// Public pages
const HomePage            = lazy(() => import('./pages/HomePage'))
const DoctorsPage         = lazy(() => import('./pages/DoctorsPage'))
const DoctorDetailPage    = lazy(() => import('./pages/DoctorDetailPage'))
const HospitalsPage       = lazy(() => import('./pages/HospitalsPage'))
const HospitalDetailPage  = lazy(() => import('./pages/HospitalDetailPage'))
const BookAppointmentPage = lazy(() => import('./pages/BookAppointmentPage'))
const MyAppointmentsPage    = lazy(() => import('./pages/MyAppointmentsPage'))
const AppointmentTicketPage = lazy(() => import('./pages/AppointmentTicketPage'))
const ProfilePage           = lazy(() => import('./pages/ProfilePage'))
const ForgotPasswordPage    = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage     = lazy(() => import('./pages/ResetPasswordPage'))
const TopDoctorsPage        = lazy(() => import('./pages/TopDoctorsPage'))
const TopHospitalsPage      = lazy(() => import('./pages/TopHospitalsPage'))
const LoginPage             = lazy(() => import('./pages/LoginPage'))
const RegisterPage          = lazy(() => import('./pages/RegisterPage'))
const ServicesPage          = lazy(() => import('./pages/ServicesPage'))
const ServiceDetailPage      = lazy(() => import('./pages/ServiceDetailPage'))
const ContactPage           = lazy(() => import('./pages/ContactPage'))

// Auth pages (NEW — dual patient/doctor system)
const RegistrationChoicePage = lazy(() => import('./pages/auth/RegistrationChoicePage'))
const OtpVerificationPage    = lazy(() => import('./pages/auth/OtpVerificationPage'))
const PatientRegisterPage    = lazy(() => import('./pages/auth/PatientRegisterPage'))
const DoctorRegisterPage     = lazy(() => import('./pages/auth/DoctorRegisterPage'))
const LoginChoicePage        = lazy(() => import('./pages/auth/LoginChoicePage'))
const PatientLoginPage       = lazy(() => import('./pages/auth/PatientLoginPage'))
const DoctorLoginPage        = lazy(() => import('./pages/auth/DoctorLoginPage'))
const HospitalLoginPage      = lazy(() => import('./pages/auth/HospitalLoginPage'))
const AdminSecureLoginPage   = lazy(() => import('./pages/auth/AdminSecureLoginPage'))
const HospitalRegisterPage   = lazy(() => import('./pages/auth/HospitalRegisterPage'))

// Info Pages
const AboutPage             = lazy(() => import('./pages/info/AboutPage'))
const LegalPage             = lazy(() => import('./pages/info/LegalPage'))
const SupportPage           = lazy(() => import('./pages/info/SupportPage'))
const DoctorInfoPage        = lazy(() => import('./pages/info/DoctorInfoPage'))
const HospitalInfoPage      = lazy(() => import('./pages/info/HospitalInfoPage'))
const NotFoundPage          = lazy(() => import('./pages/info/NotFoundPage'))

// Admin pages
const DashboardPage       = lazy(() => import('./pages/admin/DashboardPage'))
const DoctorListPage      = lazy(() => import('./pages/admin/doctors/DoctorListPage'))
const DoctorFormPage      = lazy(() => import('./pages/admin/doctors/DoctorFormPage'))
const DoctorDetailPageAdmin = lazy(() => import('./pages/admin/doctors/DoctorDetailPage'))
const HospitalListPage    = lazy(() => import('./pages/admin/hospitals/HospitalListPage'))
const HospitalFormPage    = lazy(() => import('./pages/admin/hospitals/HospitalFormPage'))
const HospitalDetailPageAdmin = lazy(() => import('./pages/admin/hospitals/HospitalDetailPage'))
const SpecialtyListPage   = lazy(() => import('./pages/admin/specialties/SpecialtyListPage'))
const SpecialtyFormPage   = lazy(() => import('./pages/admin/specialties/SpecialtyFormPage'))
const DivisionListPage    = lazy(() => import('./pages/admin/divisions/DivisionListPage'))
const DivisionFormPage    = lazy(() => import('./pages/admin/divisions/DivisionFormPage'))
const DistrictListPage    = lazy(() => import('./pages/admin/districts/DistrictListPage'))
const DistrictFormPage    = lazy(() => import('./pages/admin/districts/DistrictFormPage'))
const UpazilaListPage     = lazy(() => import('./pages/admin/upazilas/UpazilaListPage'))
const UpazilaFormPage     = lazy(() => import('./pages/admin/upazilas/UpazilaFormPage'))
const UnionListPage       = lazy(() => import('./pages/admin/unions/UnionListPage'))
const UnionFormPage       = lazy(() => import('./pages/admin/unions/UnionFormPage'))
const ChamberListPage     = lazy(() => import('./pages/admin/chambers/ChamberListPage'))
const ChamberFormPage     = lazy(() => import('./pages/admin/chambers/ChamberFormPage'))
const AppointmentListPage = lazy(() => import('./pages/admin/appointments/AppointmentListPage'))
const AppointmentFormPage = lazy(() => import('./pages/admin/appointments/AppointmentFormPage'))
const AppointmentViewPage = lazy(() => import('./pages/admin/appointments/AppointmentViewPage'))
const PrescriptionListPage = lazy(() => import('./pages/admin/prescriptions/PrescriptionListPage'))
const HighlightManagementPage = lazy(() => import('./pages/admin/highlights/HighlightManagementPage'))
const PrescriptionFormPage = lazy(() => import('./pages/admin/prescriptions/PrescriptionFormPage'))
const PrescriptionViewPage = lazy(() => import('./pages/admin/prescriptions/PrescriptionViewPage'))
const DoctorNotesPage      = lazy(() => import('./pages/admin/prescriptions/DoctorNotesPage'))
const MedicineListPage    = lazy(() => import('./pages/admin/medicines/MedicineListPage'))
const MedicineFormPage    = lazy(() => import('./pages/admin/medicines/MedicineFormPage'))
const UserListPage        = lazy(() => import('./pages/admin/users/UserListPage'))
const PatientProfilePage  = lazy(() => import('./pages/admin/users/PatientProfilePage'))
const PaymentListPage     = lazy(() => import('./pages/admin/payments/PaymentListPage'))
const ContentManagerPage  = lazy(() => import('./pages/admin/content/ContentManagerPage'))
const ServiceListPage    = lazy(() => import('./pages/admin/services/ServiceListPage'))
const ServiceFormPage    = lazy(() => import('./pages/admin/services/ServiceFormPage'))
const PatientListPage     = lazy(() => import('./pages/admin/patients/PatientListPage'))
const PatientFormPage     = lazy(() => import('./pages/admin/patients/PatientFormPage'))

// Subscription pages
const SubscriptionPage       = lazy(() => import('./pages/admin/subscription/SubscriptionPage'))
const CheckoutPage           = lazy(() => import('./pages/admin/subscription/CheckoutPage'))
const SubscriptionHistoryPage = lazy(() => import('./pages/admin/subscription/SubscriptionHistoryPage'))
const AdminSubscriptionListPage = lazy(() => import('./pages/admin/subscription/AdminSubscriptionListPage'))
const NotificationsPage      = lazy(() => import('./pages/admin/subscription/NotificationsPage'))
const AdminPackagesPage      = lazy(() => import('./pages/admin/subscription/AdminPackagesPage'))
const AdminPromoCodesPage    = lazy(() => import('./pages/admin/subscription/AdminPromoCodesPage'))
const AdminTrialDaysPage     = lazy(() => import('./pages/admin/subscription/AdminTrialDaysPage'))
const AdminMessagesPage      = lazy(() => import('./pages/admin/subscription/AdminMessagesPage'))

// Commission & Service Management
const ServiceEnablementPage  = lazy(() => import('./pages/admin/commission/ServiceEnablementPage'))

// Reports
const CommissionReportPage   = lazy(() => import('./pages/admin/reports/CommissionReportPage'))
const PurchaseReportPage     = lazy(() => import('./pages/admin/reports/PurchaseReportPage'))

// Admin Profile & Password
const AdminProfilePage       = lazy(() => import('./pages/admin/AdminProfilePage'))
const AdminPasswordPage      = lazy(() => import('./pages/admin/AdminPasswordPage'))

// Audit Log
const AuditLogPage           = lazy(() => import('./pages/admin/audit/AuditLogPage'))


function PageLoader() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 999999,
      background: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        width: 340,
        height: 340,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 230, 153, 0.16) 0%, rgba(5, 19, 37, 0.03) 60%, transparent 75%)',
        animation: 'ambientPulse 3s ease-in-out infinite alternate',
        pointerEvents: 'none'
      }} />
      <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
        <svg style={{ width: 120, height: 120, display: 'block', overflow: 'visible' }} viewBox="16 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path className="svg-d-base" d="M 56 44 H 120 A 56 56 0 0 1 120 156 H 56" />
          <path className="svg-d-light-glow" d="M 56 44 H 120 A 56 56 0 0 1 120 156 H 56" />
          <path className="svg-d-light-beam" d="M 56 44 H 120 A 56 56 0 0 1 120 156 H 56" />
          <g className="svg-plus-cross">
            <line className="svg-plus-arm" x1="88" y1="76" x2="88" y2="124" />
            <line className="svg-plus-arm" x1="64" y1="100" x2="112" y2="100" />
          </g>
        </svg>
      </div>

      <style>{`
        .svg-d-base {
          stroke: #051325;
          stroke-width: 26;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(0 8px 20px rgba(5, 19, 37, 0.15));
        }
        .svg-d-light-beam {
          stroke: #00FFB0;
          stroke-width: 5;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 90 220;
          stroke-dashoffset: 310;
          filter: drop-shadow(0 0 8px #00FFB0) drop-shadow(0 0 14px rgba(0, 255, 176, 0.8));
          animation: lightBeamSweep 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .svg-d-light-glow {
          stroke: rgba(0, 255, 176, 0.4);
          stroke-width: 12;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 100 210;
          stroke-dashoffset: 310;
          filter: blur(4px);
          animation: lightBeamSweep 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .svg-plus-cross {
          filter: drop-shadow(0 0 12px rgba(0, 230, 153, 0.75)) drop-shadow(0 0 20px rgba(0, 230, 153, 0.4));
          animation: crossGlowPulse 2.2s ease-in-out infinite alternate;
          transform-origin: 88px 100px;
        }
        .svg-plus-arm {
          stroke: #00B875;
          stroke-width: 18;
          stroke-linecap: round;
        }
        @keyframes lightBeamSweep {
          0% { stroke-dashoffset: 310; opacity: 0.2; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { stroke-dashoffset: -310; opacity: 0.2; }
        }
        @keyframes crossGlowPulse {
          0% { transform: scale(0.97); filter: drop-shadow(0 0 6px rgba(0, 230, 153, 0.4)); }
          100% { transform: scale(1.04); filter: drop-shadow(0 0 16px rgba(0, 230, 153, 0.95)) drop-shadow(0 0 24px rgba(0, 255, 176, 0.6)); }
        }
        @keyframes ambientPulse {
          0% { transform: scale(0.92); opacity: 0.4; }
          100% { transform: scale(1.15); opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary message="The application encountered an error. Please refresh the page.">
      <ScrollToTop />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ===== ADMIN PANEL ROUTES ===== */}
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<DashboardPage />} />

            {/* Doctors */}
            <Route path="doctors" element={<DoctorListPage />} />
            <Route path="doctors/create" element={<DoctorFormPage />} />
            <Route path="doctors/edit/:id" element={<DoctorFormPage />} />
            <Route path="doctors/view/:id" element={<DoctorDetailPageAdmin />} />

            {/* Hospitals */}
            <Route path="hospitals" element={<HospitalListPage />} />
            <Route path="hospitals/create" element={<HospitalFormPage />} />
            <Route path="hospitals/edit/:id" element={<HospitalFormPage />} />
            <Route path="hospitals/view/:id" element={<HospitalDetailPageAdmin />} />

            {/* Specialties */}
            <Route path="specialties" element={<SpecialtyListPage />} />
            <Route path="specialties/create" element={<SpecialtyFormPage />} />
            <Route path="specialties/edit/:id" element={<SpecialtyFormPage />} />

            {/* Divisions */}
            <Route path="divisions" element={<DivisionListPage />} />
            <Route path="divisions/create" element={<DivisionFormPage />} />
            <Route path="divisions/edit/:id" element={<DivisionFormPage />} />

            {/* Districts */}
            <Route path="districts" element={<DistrictListPage />} />
            <Route path="districts/create" element={<DistrictFormPage />} />
            <Route path="districts/edit/:id" element={<DistrictFormPage />} />

            {/* Upazilas */}
            <Route path="upazilas" element={<UpazilaListPage />} />
            <Route path="upazilas/create" element={<UpazilaFormPage />} />
            <Route path="upazilas/edit/:id" element={<UpazilaFormPage />} />

            {/* Unions */}
            <Route path="unions" element={<UnionListPage />} />
            <Route path="unions/create" element={<UnionFormPage />} />
            <Route path="unions/edit/:id" element={<UnionFormPage />} />

            {/* Chambers */}
            <Route path="chambers" element={<ChamberListPage />} />
            <Route path="chambers/create" element={<ChamberFormPage />} />
            <Route path="chambers/edit/:id" element={<ChamberFormPage />} />

            {/* Appointments */}
            <Route path="appointments" element={<AppointmentListPage />} />
            <Route path="appointments/create" element={<AppointmentFormPage />} />
            <Route path="appointments/edit/:id" element={<AppointmentFormPage />} />
            <Route path="appointments/view/:id" element={<AppointmentViewPage />} />

            {/* Prescriptions */}
            <Route path="prescriptions" element={<SubscriptionGate moduleName="Prescriptions"><PrescriptionListPage /></SubscriptionGate>} />
            <Route path="prescriptions/create" element={<SubscriptionGate moduleName="Prescriptions"><PrescriptionFormPage /></SubscriptionGate>} />
            <Route path="prescriptions/edit/:id" element={<SubscriptionGate moduleName="Prescriptions"><PrescriptionFormPage /></SubscriptionGate>} />
            <Route path="prescriptions/view/:id" element={<SubscriptionGate moduleName="Prescriptions"><PrescriptionViewPage /></SubscriptionGate>} />
            <Route path="notes" element={<SubscriptionGate moduleName="My Notes"><DoctorNotesPage /></SubscriptionGate>} />

            {/* Patients (NEW — separate registration table) */}
            <Route path="patients" element={<PatientListPage />} />
            <Route path="patients/create" element={<PatientFormPage />} />
            <Route path="patients/edit/:id" element={<PatientFormPage />} />

            {/* Users */}
            <Route path="users" element={<UserListPage />} />
            <Route path="users/:id" element={<PatientProfilePage />} />

            {/* Medicines */}
            <Route path="medicines" element={<SubscriptionGate moduleName="Medicines"><MedicineListPage /></SubscriptionGate>} />
            <Route path="medicines/create" element={<SubscriptionGate moduleName="Medicines"><MedicineFormPage /></SubscriptionGate>} />
            <Route path="medicines/edit/:id" element={<SubscriptionGate moduleName="Medicines"><MedicineFormPage /></SubscriptionGate>} />

            {/* Payments */}
            <Route path="payments" element={<SubscriptionGate moduleName="Payments"><PaymentListPage /></SubscriptionGate>} />

            {/* Content Management */}
            <Route path="content" element={<ContentManagerPage />} />
            <Route path="services" element={<ServiceListPage />} />
            <Route path="services/create" element={<ServiceFormPage />} />
            <Route path="services/edit/:id" element={<ServiceFormPage />} />

            {/* Subscription System */}
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="subscription/checkout/:packageId" element={<CheckoutPage />} />
            <Route path="subscription/history" element={<SubscriptionHistoryPage />} />
            <Route path="notifications" element={<NotificationsPage />} />

            {/* Admin Subscription Management */}
            <Route path="subscriptions" element={<AdminSubscriptionListPage />} />
            <Route path="subscription-packages" element={<AdminPackagesPage />} />
            <Route path="promo-codes" element={<AdminPromoCodesPage />} />
            <Route path="trial-days" element={<AdminTrialDaysPage />} />
            <Route path="highlights" element={<HighlightManagementPage />} />
            <Route path="messages" element={<AdminMessagesPage />} />

            {/* Commission & Service Management */}
            <Route path="commission" element={<ServiceEnablementPage />} />

            {/* Reports */}
            <Route path="reports/commission" element={<CommissionReportPage />} />
            <Route path="reports/purchase" element={<PurchaseReportPage />} />

            {/* Profile & Password */}
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="password" element={<AdminPasswordPage />} />

            {/* Audit Log */}
            <Route path="audit-logs" element={<AuditLogPage />} />
          </Route>

          {/* ===== AUTH ROUTES (No navbar/footer) ===== */}
          <Route path="/admin-secure-access" element={<AdminSecureLoginPage />} />

          {/* ===== PUBLIC / PATIENT ROUTES ===== */}
          <Route
            path="*"
            element={
              <>
                <AppNavbar />
                <Routes>
                  <Route path="/"           element={<HomePage />} />
                  <Route path="/doctors"    element={<DoctorsPage />} />
                  <Route path="/doctors/:id" element={<DoctorDetailPage />} />
                  <Route path="/hospitals"  element={<HospitalsPage />} />
                  <Route path="/hospitals/:id" element={<HospitalDetailPage />} />
                  <Route path="/login"      element={<LoginPage />} />
                  <Route path="/register"   element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password"  element={<ResetPasswordPage />} />
                  <Route path="/top-10-doctors" element={<TopDoctorsPage />} />
                  <Route path="/top-10-hospitals" element={<TopHospitalsPage />} />
                  
                  <Route path="/services"        element={<ServicesPage />} />
                  <Route path="/services/:id"    element={<ServiceDetailPage />} />
                  <Route path="/contact"         element={<ContactPage />} />
                  
                  {/* Info Routes */}
                  <Route path="/about"           element={<AboutPage />} />
                  <Route path="/legal"           element={<LegalPage />} />
                  <Route path="/support"         element={<SupportPage />} />
                  <Route path="/register-doctor"   element={<DoctorInfoPage />} />
                  <Route path="/register-hospital" element={<HospitalInfoPage />} />

                  <Route path="/book-appointment" element={<BookAppointmentPage />} />
                  <Route path="/book-appointment/:doctorId" element={<BookAppointmentPage />} />
                  <Route path="/my-appointments"      element={<ProtectedRoute><MyAppointmentsPage /></ProtectedRoute>} />
                  <Route path="/my-appointments/:id"  element={<ProtectedRoute><AppointmentTicketPage /></ProtectedRoute>} />
                  <Route path="/prescriptions/view/:id" element={<ProtectedRoute><PrescriptionViewPage /></ProtectedRoute>} />
                  <Route path="/profile"              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
                <Footer />
                <BackToTop />
                <FloatingBottomNav />
              </>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
