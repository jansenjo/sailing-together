import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import MapView from './pages/MapView'
import CrewListings from './pages/CrewListings'
import BoatListings from './pages/BoatListings'
import NewListing from './pages/NewListing'
import ListingDetail from './pages/ListingDetail'
import EditListing from './pages/EditListing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminLayout from './pages/admin/AdminLayout'
import AdminOverview from './pages/admin/AdminOverview'
import AdminListings from './pages/admin/AdminListings'
import AdminUsers from './pages/admin/AdminUsers'
import AdminMessages from './pages/admin/AdminMessages'
import Disclaimer from './pages/Disclaimer'
import Privacy from './pages/Privacy'
import Footer from './components/Footer'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Admin – eigen layout, geen Navbar */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index           element={<AdminOverview />} />
        <Route path="listings" element={<AdminListings />} />
        <Route path="users"    element={<AdminUsers />} />
        <Route path="messages" element={<AdminMessages />} />
      </Route>

      {/* Main app */}
      <Route path="*" element={
        <>
          <Navbar />
          <main>
            <Routes>
              <Route path="/"            element={<Home />} />
              <Route path="/kaart"       element={<MapView />} />
              <Route path="/crew"        element={<CrewListings />} />
              <Route path="/boten"       element={<BoatListings />} />
              <Route path="/aanbieden"   element={<NewListing />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/listing/:id/edit" element={<ProtectedRoute><EditListing /></ProtectedRoute>} />
              <Route path="/login"       element={<Login />} />
              <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/disclaimer"  element={<Disclaimer />} />
              <Route path="/privacy"     element={<Privacy />} />
            </Routes>
          </main>
          <Footer />
        </>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
