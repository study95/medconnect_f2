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
const CommissionReportPage   = lazy(() => import('./pages/admin/reports/CommissionReportPage'))
const PurchaseReportPage     = lazy(() => import('./pages/admin/reports/PurchaseReportPage'))

// Profile & Password
const AdminProfilePage       = lazy(() => import('./pages/admin/AdminProfilePage'))
const AdminPasswordPage      = lazy(() => import('./pages/admin/AdminPasswordPage'))
const AuditLogPage           = lazy(() => import('./pages/admin/audit/AuditLogPage'))

function PageLoader() {
  return (
    <div style={{ 
      position: 'fixed',
      inset: 0,
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #FFFFFF 0%, #F8FAFC 100%)',
      zIndex: 99999
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 168, 140, 0.12) 0%, rgba(0, 168, 140, 0) 70%)',
        filter: 'blur(30px)',
        pointerEvents: 'none',
        animation: 'loader-pulse-glow 3s ease-in-out infinite'
      }} />

      <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Animated Outer Orbit Rings */}
        <div className="loader-ring-outer" style={{ 
          position: 'absolute', width: '100%', height: '100%', 
          borderRadius: '50%', 
          border: '2px dashed rgba(0, 168, 140, 0.25)',
          animation: 'loader-spin 12s linear infinite'
        }} />

        <div className="loader-ring-spin" style={{ 
          position: 'absolute', width: '90%', height: '90%', 
          borderRadius: '50%', 
          border: '2.5px solid transparent',
          borderTopColor: '#00A88C',
          borderRightColor: 'rgba(0, 168, 140, 0.3)',
          animation: 'loader-spin-fast 1.2s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite'
        }} />

        <div className="loader-ring-inner" style={{ 
          position: 'absolute', width: '74%', height: '74%', 
          borderRadius: '50%', 
          border: '2px solid transparent',
          borderBottomColor: '#00C9A7',
          animation: 'loader-spin-reverse 1.8s linear infinite'
        }} />

        {/* Center Logo Container */}
        <div style={{
          width: 72, 
          height: 72, 
          borderRadius: 22,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 14px 35px rgba(0, 168, 140, 0.18), 0 0 0 1px rgba(0, 168, 140, 0.1)',
          animation: 'loader-breathe 2.4s ease-in-out infinite',
          zIndex: 2,
          padding: '10px'
        }}>
          <img 
            src="/doctorBookletLogo.png" 
            alt="Doctor Booklet Logo" 
            style={{ 
              maxHeight: '44px', 
              maxWidth: '44px', 
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 6px rgba(0, 168, 140, 0.25))'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '22px',
            color: '#00A88C',
            fontFamily: "'Outfit', sans-serif"
          }}>
            DB
          </div>
        </div>
      </div>

      {/* Brand Text & Status Indicator */}
      <div style={{ marginTop: 28, textAlign: 'center', zIndex: 2 }}>
        <h2 style={{ 
          fontSize: 24, 
          fontWeight: 900, 
          color: '#0F172A', 
          margin: 0, 
          letterSpacing: '-0.8px', 
          fontFamily: "'Outfit', 'Inter', sans-serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          Doctor <span style={{ color: '#00A88C' }}>Booklet</span>
        </h2>
        
        <p style={{ 
          fontSize: 12, 
          color: '#64748B', 
          fontWeight: 700, 
          marginTop: 6, 
          letterSpacing: '1.5px', 
          textTransform: 'uppercase',
          fontFamily: "'Inter', sans-serif"
        }}>
          Loading Excellence...PP
        </p>

        {/* Dynamic Progress Line */}
        <div style={{
          width: 140,
          height: 4,
          background: 'rgba(0, 168, 140, 0.12)',
          borderRadius: 10,
          margin: '12px auto 0',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '45%',
            background: 'linear-gradient(90deg, #00A88C, #00D4AF)',
            borderRadius: 10,
            animation: 'preloader-bar-slide 1.5s ease-in-out infinite'
          }} />
        </div>
      </div>

      <style>{`
        @keyframes loader-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes loader-spin-fast {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes loader-spin-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes loader-breathe {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.06); filter: brightness(1.08); }
        }
        @keyframes loader-pulse-glow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes preloader-bar-slide {
          0% { left: -45%; }
          50% { left: 100%; }
          100% { left: -45%; }
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
