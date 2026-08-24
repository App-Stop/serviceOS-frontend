import React from 'react'
import { Routes, Route } from 'react-router-dom'
import SignIn from './pages/SignIn'
import { VerifyOtp } from './pages/VerifyOtp'
import { Welcome } from './pages/Welcome'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Invoices from './pages/Invoices'
import InvoiceBuilder from './pages/InvoiceBuilder'
import InvoiceDetail from './pages/InvoiceDetail'
import Team from './pages/Team'
import TeamDetail from './pages/TeamDetail'
import Communications from './pages/Communications'

const App = () => {
  return (
    <Routes>
      <Route path='/' element={<SignIn />} />
      <Route path='/login' element={<SignIn />} />
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path='/verify-otp' element={<VerifyOtp />} />
      <Route path='/welcome' element={<Welcome />} />
      <Route path='/customers' element={<Customers />} />
      <Route path='/customers/:id' element={<CustomerDetail />} />
      <Route path='/jobs' element={<Jobs />} />
      <Route path='/jobs/:id' element={<JobDetail />} />
      <Route path='/invoices' element={<Invoices />} />
      <Route path='/invoices/new' element={<InvoiceBuilder />} />
      <Route path='/invoices/:id/edit' element={<InvoiceBuilder />} />
      <Route path='/invoices/:id' element={<InvoiceDetail />} />
      <Route path='/onboarding' element={<Onboarding />} />
      <Route path='/communication' element={<Communications />} />
      <Route path='/team' element={<Team />} />
      <Route path='/team/:id' element={<TeamDetail />} />
    </Routes>
  )
}

export default App