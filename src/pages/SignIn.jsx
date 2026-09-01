import React, { useState } from 'react';
import bgFade from '../assets/bgFade.png';
import { InputGroup } from '../components/InputGroup';
import { Button } from '../components/Button';
import { GoogleLogo } from '../components/GoogleLogo';
import { ArrowRight } from 'lucide-react';
import './SignIn.css';
import { useNavigate } from 'react-router-dom';
import { signInApi } from '../api/auth';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    try {
      const data = await signInApi(email);
      if (data?.success) {
        navigate('/verify-otp', { state: { email } });
      } else {
        setError(data?.message || 'Sign in failed. Please try again.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    console.log('Sign in with Google');
  };

  return (
    <div className="relative bg-primary-light min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background Fade Image */}
      <img
        src={bgFade}
        alt="Background Fade"
        className="w-full absolute bottom-0 left-0 object-cover pointer-events-none max-h-[811px]"
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[1240px] px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-24">
        
        {/* Left Hero Section */}
        <div className="flex flex-col items-start max-w-[483px] text-left">
          <span className="text-xl font-semibold text-neutral-900 mb-6">
            ServiceOS
          </span>
          <h1 className="text-4xl lg:text-5xl font-semibold text-neutral-900 tracking-tight leading-[1.15] mb-4">
            Run your field service business smarter.
          </h1>
          <p className="text-base text-black-500 font-normal leading-relaxed">
            Schedule, dispatch, invoice, and grow — all in one platform built for service teams of 2 to ♾️.
          </p>
        </div>

        {/* Right Sign In Card */}
        <div className="auth-card">
          <div className="modal-header">
            <h2 className="modal-title">Sign In</h2>
            <p className="modal-subtitle">Sign in to your ServiceOS account</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {error}
              </div>
            )}
            <InputGroup
              label="Email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" endIcon={<ArrowRight className="w-4 h-4" />} className="mt-2" disabled={email === '' || loading}>
              {loading ? 'Sending code...' : 'Continue'}
            </Button>
          </form>

          <div className="divider-container">
            <div className="divider-line">
              <div className="divider-line-inner"></div>
            </div>
            <span className="divider-text">OR</span>
          </div>

          <Button
            type="button"
            variant="secondary"
            icon={<GoogleLogo />}
            onClick={handleGoogleSignIn}
          >
            Continue with Google
          </Button>
        </div>

      </div>
    </div>
  );
};

export default SignIn;