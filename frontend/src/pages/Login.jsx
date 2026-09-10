import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [isRegister, setIsRegister] = useState(false);
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [district, setDistrict] = useState('Anand');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);

  // Send OTP
  const handleSendOtp = (e) => {
    e.preventDefault();
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (isRegister && (!fullName || !farmName)) {
      toast.error('Please enter your Name and Farm Name');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      toast.success(`OTP sent to +91 ${phone}`);
    }, 600);
  };

  // Handle individual OTP digits
  const handleOtpInput = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Verify OTP and Login
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const user = {
        id: '1',
        name: fullName || 'Ramesh Patel',
        phone: `+91 ${phone}`,
        farmName: farmName || 'Surabhi Dairy & Breeding Farm',
        district: district || 'Anand',
      };
      login(user, 'mock-jwt-token-lactoguard');
      toast.success(`Welcome to LactoGuard, ${user.name}`);
      navigate('/dashboard');
    }, 700);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* ── IIT-Style Institutional Top Header ── */}
      <header className="bg-white border-b-2 border-[#800000] shadow-sm">
        <div className="bg-[#1e3a5f] text-white text-[11px] py-1 px-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <span>INDIAN DAIRY HEALTH INITIATIVE • ICAR-NDRI VALIDATED PROTOCOLS</span>
            <span>Helpline: 1962 (Toll Free)</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#1e3a5f] border-2 border-[#800000] text-amber-300 flex items-center justify-center font-serif font-black text-lg shadow-sm">
              LG
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg text-[#1e3a5f] leading-none">
                LactoGuard
              </h1>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Precision Bovine Health Intelligence System
              </p>
            </div>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-semibold border border-slate-200">
            Secure Portal
          </span>
        </div>
      </header>

      {/* ── Main Authentication Box ── */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg shadow-md p-6 sm:p-8 space-y-6">
          {/* Card Title */}
          <div className="text-center border-b border-slate-100 pb-4">
            <h2 className="text-xl font-serif font-bold text-[#1e3a5f]">
              {step === 'otp'
                ? 'Verify Mobile Number'
                : isRegister
                ? 'Farmer Registration'
                : 'Dairy Portal Login'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {step === 'otp'
                ? `Enter the 6-digit OTP sent to +91 ${phone}`
                : isRegister
                ? 'Register your dairy farm to start 7-14 day mastitis monitoring'
                : 'Login with your registered 10-digit mobile number'}
            </p>
          </div>

          {/* Form */}
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2.5 text-sm outline-none focus:border-[#1e3a5f]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Dairy Farm Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Surabhi Dairy Farm"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2.5 text-sm outline-none focus:border-[#1e3a5f]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">District / State</label>
                    <input
                      type="text"
                      placeholder="e.g. Anand, Gujarat"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2.5 text-sm outline-none focus:border-[#1e3a5f]"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Mobile Number (10 Digits)</label>
                <div className="flex rounded border border-slate-300 focus-within:border-[#1e3a5f] overflow-hidden">
                  <span className="bg-slate-100 text-slate-600 px-3 py-2.5 text-sm font-semibold border-r border-slate-300">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 text-sm outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1e3a5f] hover:bg-[#162a45] text-white font-bold py-2.5 rounded text-sm transition-colors shadow-sm mt-2"
              >
                {loading ? 'Sending OTP...' : 'Send OTP →'}
              </button>

              {/* Toggle Register / Login */}
              <div className="pt-3 text-center border-t border-slate-100 text-xs text-slate-600">
                {isRegister ? (
                  <span>
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(false);
                        setStep('phone');
                      }}
                      className="text-[#1e3a5f] font-bold hover:underline"
                    >
                      Login here
                    </button>
                  </span>
                ) : (
                  <span>
                    New farmer or dairy cooperative?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(true);
                        setStep('phone');
                      }}
                      className="text-[#1e3a5f] font-bold hover:underline"
                    >
                      Register New Farm
                    </button>
                  </span>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              {/* 6 Digit OTP Input Boxes */}
              <div className="space-y-2">
                <label className="block text-slate-700 font-bold text-center mb-2">
                  Enter 6-Digit OTP (Use any 6 digits for testing, e.g. 123456)
                </label>
                <div className="flex justify-center space-x-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpInput(idx, e.target.value)}
                      className="w-10 h-12 text-center text-lg font-bold border border-slate-300 rounded focus:border-[#1e3a5f] outline-none font-mono bg-slate-50 focus:bg-white"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1e3a5f] hover:bg-[#162a45] text-white font-bold py-2.5 rounded text-sm transition-colors shadow-sm mt-3"
              >
                {loading ? 'Verifying...' : 'Verify OTP & Enter Portal'}
              </button>

              <div className="flex justify-between items-center pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-slate-500 hover:text-slate-800"
                >
                  ← Change Number
                </button>
                <button
                  type="button"
                  onClick={() => toast.success(`New OTP sent to +91 ${phone}`)}
                  className="text-[#1e3a5f] font-bold hover:underline"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        LactoGuard Precision Health Platform • Developed under Indian Dairy Health & SIH Problem Statement #109
      </footer>
    </div>
  );
}
