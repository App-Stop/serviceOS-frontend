import React from 'react'
import { Routes, Route } from 'react-router-dom'
import SignIn from './pages/SignIn'
import { VerifyOtp } from './pages/VerifyOtp'
import { Welcome } from './pages/Welcome'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Schedule from './pages/Schedule'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Invoices from './pages/Invoices'
import InvoiceBuilder from './pages/InvoiceBuilder'
import InvoiceDetail from './pages/InvoiceDetail'
import Team from './pages/Team'
import TeamDetail from './pages/TeamDetail'
import Communications from './pages/Communications'
import Reviews from './pages/Reviews'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import { RequireApp, RequireSession } from './components/RouteGuard'

/** Wraps a product screen in the mode guard shared by all of them. */
const app = (element) => <RequireApp>{element}</RequireApp>

const App = () => {
  return (
    <Routes>
      <Route path='/' element={<SignIn />} />
      <Route path='/login' element={<SignIn />} />
      <Route path='/verify-otp' element={<VerifyOtp />} />

      {/* Signed in, but before the live/demo fork is answered. */}
      <Route path='/welcome' element={<RequireSession><Welcome /></RequireSession>} />
      <Route path='/onboarding' element={<RequireSession><Onboarding /></RequireSession>} />

      <Route path='/dashboard' element={app(<Dashboard />)} />
      <Route path='/customers' element={app(<Customers />)} />
      <Route path='/customers/:id' element={app(<CustomerDetail />)} />
      <Route path='/schedule' element={app(<Schedule />)} />
      <Route path='/jobs' element={app(<Jobs />)} />
      <Route path='/jobs/:id' element={app(<JobDetail />)} />
      <Route path='/invoices' element={app(<Invoices />)} />
      <Route path='/invoices/new' element={app(<InvoiceBuilder />)} />
      <Route path='/invoices/:id/edit' element={app(<InvoiceBuilder />)} />
      <Route path='/invoices/:id' element={app(<InvoiceDetail />)} />
      <Route path='/communication' element={app(<Communications />)} />
      <Route path='/team' element={app(<Team />)} />
      <Route path='/team/:id' element={app(<TeamDetail />)} />
      <Route path='/reviews' element={app(<Reviews />)} />
      <Route path='/reports' element={app(<Reports />)} />
      <Route path='/profile' element={app(<Profile />)} />
    </Routes>
  )
}

export default App
