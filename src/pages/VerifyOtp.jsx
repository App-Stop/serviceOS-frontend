import React, { useState } from 'react';
import bgFade from '../assets/bgFade.png';
import { OtpInput } from '../components/OtpInput';
import { Button } from '../components/Button';
import { ArrowLeft, Lightbulb, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import badgeCheck from '../assets/badge-check.png';
import { verifyOtpApi, signInApi } from '../api/auth';
import { APP_MODE, getAppMode, setAppMode } from '../appMode';

export const VerifyOtp = () => {
  const [otp, setOtp] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendMessage, setResendMessage] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'name@company.com';

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length === 4) {
      setLoading(true);
      setError('');
      try {
        const data = await verifyOtpApi(email, otp);
        if (data?.success && data?.data?.token) {
          localStorage.setItem('token', data.data.token);
          if (data?.data?.user) {
            localStorage.setItem('user', JSON.stringify(data.data.user));
          }
          const user = data?.data?.user;
          const isOnboardingCompleted = user?.isOnboardingCompleted ?? false;

          // An account that already finished onboarding has real data to come
          // back to, so it skips the welcome fork — unless it deliberately
          // left the app in demo mode.
          if (isOnboardingCompleted && !getAppMode()) {
            setAppMode(APP_MODE.LIVE);
          }

          setIsVerified(true);
          setTimeout(() => {
            setIsFadingOut(true);
          }, 700);
          setTimeout(() => {
            if (isOnboardingCompleted) {
              navigate('/dashboard');
            } else {
              navigate('/welcome');
            }
          }, 1200);
        } else {
          setError(data?.message || 'Verification failed.');
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Invalid OTP code.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResend = async () => {
    setError('');
    setResendMessage('');
    try {
      const data = await signInApi(email);
      if (data?.success) {
        setResendMessage('A new OTP has been sent to your email.');
      } else {
        setError(data?.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  return (
    <div className={`relative bg-primary-light min-h-screen w-full overflow-hidden flex flex-col items-center justify-center p-4 transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background Fade Image */}
      <img
        src={bgFade}
        alt="Background Fade"
        className="w-full absolute bottom-0 left-0 object-cover pointer-events-none max-h-[811px]"
      />

      {/* Top Header Logo */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
        <h1 className="text-xl font-bold text-neutral-900 tracking-tight">ServiceOS</h1>
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate('/login')}
        className="absolute top-8 left-8 z-10 w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 hover:bg-neutral-50 transition-colors shadow-xs"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Main OTP Card */}
      <div className="relative z-10 auth-card">
        {isVerified ? (
          <div className="flex flex-col items-center text-center py-6 animate-fade-in">
            <img src={badgeCheck} className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" alt="" />
            <h2 className="text-2xl font-semibold text-neutral-900">OTP Verified</h2>
            <p className="text-sm text-black-200 mt-2">We are so excited to onboard you!</p>
          </div>
        ) : (
          <>
            <div className="modal-header mb-6">
              <h2 className="modal-title">Check your email for a code</h2>
              <p className="modal-subtitle mt-1">
                We sent a 4-digit code to{' '}
                <span className="font-semibold text-neutral-900">{email}</span>
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200 mb-4">
                {error}
              </div>
            )}

            {resendMessage && (
              <div className="text-sm text-green-600 bg-green-50 p-2 rounded border border-green-200 mb-4">
                {resendMessage}
              </div>
            )}

            <form onSubmit={handleVerify} className="flex flex-col gap-6">
              <div className="flex flex-col items-start gap-2">
                <label className="field-label">Enter Code</label>
                <OtpInput length={4} value={otp} onChange={setOtp} />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={otp.length < 4 || loading}
                endIcon={<ArrowRight className="w-4 h-4" />}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </form>

            <div className="text-center mt-2">
              <span className="text-xs text-neutral-500">Didn't receive the code? </span>
              <button
                type="button"
                onClick={handleResend}
                className="text-xs font-semibold text-neutral-900 hover:underline"
              >
                Resend Code
              </button>
            </div>

            {/* Tip Footer */}
            <div className="tip-footer">
              <Lightbulb className="w-4 h-4 text-neutral-900 shrink-0 mt-0.5" />
              <span>
                <strong className="text-neutral-900">Tip:</strong> Can’t find your code? Check your spam or junk folder.
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
