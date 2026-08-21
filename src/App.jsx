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

const App = () => {
  return (
    <Routes>
      <Route path='/' element={<Dashboard />} />
      <Route path='/login' element={<SignIn />} />
      <Route path='/verify-otp' element={<VerifyOtp />} />
      <Route path='/welcome' element={<Welcome />} />
      <Route path='/customers' element={<Customers />} />
      <Route path='/customers/:id' element={<CustomerDetail />} />
      <Route path='/jobs' element={<Jobs />} />
      <Route path='/jobs/:id' element={<JobDetail />} />
      <Route path='/onboarding' element={<Onboarding />} />
    </Routes>
  )
}

export default App