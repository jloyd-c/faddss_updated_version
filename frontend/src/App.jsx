import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Layout from './components/common/Layout'

// Auth
import Login from './pages/auth/Login'
import Landing from './pages/public/Landing'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import CriteriaManagement from './pages/admin/CriteriaManagement'

// Official pages
import OfficialDashboard from './pages/official/Dashboard'
import BeneficiaryList from './pages/official/BeneficiaryList'
import BeneficiaryDetail from './pages/official/BeneficiaryDetail'
import BeneficiaryForm from './pages/official/BeneficiaryForm'
import CycleList from './pages/official/CycleList'
import CycleDetail from './pages/official/CycleDetail'
import MarkApplicants from './pages/official/MarkApplicants'
import HouseholdManagement from './pages/official/HouseholdManagement'
import ScoringRanking from './pages/official/ScoringRanking'
import ParticipationRecord from './pages/official/ParticipationRecord'
import AuditTrail from './pages/official/AuditTrail'

// Resident pages
import ResidentProfile from './pages/resident/Profile'
import MyScore from './pages/resident/MyScore'
import ParticipationHistory from './pages/resident/ParticipationHistory'

function AdminRoutes() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>
        <Routes>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="criteria" element={<CriteriaManagement />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Layout>
    </ProtectedRoute>
  )
}

function OfficialRoutes() {
  return (
    <ProtectedRoute allowedRoles={['official', 'admin']}>
      <Layout>
        <Routes>
          <Route path="dashboard" element={<OfficialDashboard />} />
          <Route path="households" element={<HouseholdManagement />} />
          <Route path="resident-profiles" element={<BeneficiaryList />} />
          <Route path="resident-profiles/new" element={<BeneficiaryForm />} />
          <Route path="resident-profiles/:id" element={<BeneficiaryDetail />} />
          <Route path="resident-profiles/:id/edit" element={<BeneficiaryForm />} />
          <Route path="beneficiaries" element={<Navigate to="../resident-profiles" replace />} />
          <Route path="beneficiaries/new" element={<Navigate to="../resident-profiles/new" replace />} />
          <Route path="beneficiaries/:id" element={<BeneficiaryDetail />} />
          <Route path="beneficiaries/:id/edit" element={<BeneficiaryForm />} />
          <Route path="cycles" element={<CycleList />} />
          <Route path="cycles/:id" element={<CycleDetail />} />
          <Route path="cycles/:id/mark-applicants" element={<MarkApplicants />} />
          <Route path="scoring" element={<ScoringRanking />} />
          <Route path="participation" element={<ParticipationRecord />} />
          <Route path="audit" element={<AuditTrail />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Layout>
    </ProtectedRoute>
  )
}

function ResidentRoutes() {
  return (
    <ProtectedRoute allowedRoles={['resident']}>
      <Layout>
        <Routes>
          <Route path="profile" element={<ResidentProfile />} />
          <Route path="score" element={<MyScore />} />
          <Route path="history" element={<ParticipationHistory />} />
          <Route index element={<Navigate to="profile" replace />} />
        </Routes>
      </Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/official/*" element={<OfficialRoutes />} />
          <Route path="/resident/*" element={<ResidentRoutes />} />
          <Route path="/unauthorized" element={<div className="p-8 text-red-600">Access denied.</div>} />
          <Route path="/" element={<Landing />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}


