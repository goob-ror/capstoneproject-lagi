import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import LoginPresenter from './LoginPage-presenter';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);
  const lockoutTimerRef = useRef(null);

  const handleSetError = (msg) => {
    const attemptsMatch = msg.match(/\((\d+) percobaan tersisa\)/);
    if (attemptsMatch) {
      setAttemptsRemaining(parseInt(attemptsMatch[1], 10));
      setError(msg.replace(/ \(\d+ percobaan tersisa\)/, '').trim());
    } else {
      setAttemptsRemaining(null);
      setError(msg);
    }

    const cooldownMatch = msg.match(/dalam (\d+) menit/);
    if (cooldownMatch) {
      const seconds = parseInt(cooldownMatch[1], 10) * 60;
      setLockoutSeconds(seconds);
    }
  };

  const [presenter] = useState(() => new LoginPresenter({
    setLoading,
    setError: handleSetError,
    clearError: () => { setError(''); setAttemptsRemaining(null); setLockoutSeconds(0); },
    onLoginSuccess: () => navigate('/dashboard'),
    onPendingApproval: () => navigate('/waiting-approval'),
    navigateToRegister: () => navigate('/register')
  }));

  useEffect(() => {
    if (lockoutSeconds > 0) {
      lockoutTimerRef.current = setInterval(() => {
        setLockoutSeconds(prev => {
          if (prev <= 1) {
            clearInterval(lockoutTimerRef.current);
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(lockoutTimerRef.current);
  }, [lockoutSeconds]);

  useEffect(() => {
    if (error && lockoutSeconds === 0) {
      const timer = setTimeout(() => { setError(''); setAttemptsRemaining(null); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, lockoutSeconds]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recaptchaToken) {
      setError('Silakan verifikasi bahwa Anda bukan robot.');
      return;
    }
    presenter.handleLogin(formData.username, formData.password, recaptchaToken);
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
      setRecaptchaToken(null);
    }
  };

  const onRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  return (
    <div className="bg-white rounded-[25px] w-[500px] max-w-[96vw] p-[30px] relative flex flex-col box-border">

      {/* Row 1: Back button + Logo */}
      <div className="w-full flex">
        <div className="p-5 -ml-5">
          <button type="button" aria-label="Go back" onClick={handleBack}
            className="bg-transparent border-none cursor-pointer p-0 flex items-center justify-center">
            <svg width="13" height="21" viewBox="0 0 13 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M10.3333 20.6667L0 10.3333L10.3333 1.90735e-06L12.9167 2.58334L5.16667 10.3333L12.9167 18.0833L10.3333 20.6667Z" fill="#22C55E"/>
            </svg>
          </button>
        </div>
        <div className="w-full -ml-[21px] flex justify-center items-center">
          <img src="/images/logo-withText.png" alt="logo" className="w-[76px] h-[74px]" />
        </div>
      </div>

      {/* Row 2: Title + Subtitle */}
      <div className="w-full flex flex-col mt-[15px] text-center">
        <h1 className="font-montserrat font-bold text-[22px] leading-8 text-[#515151] m-0 p-0">
          Selamat Datang!
        </h1>
        <p className="font-istok font-normal text-[14px] leading-5 text-[#515151] m-0 p-0 -mt-1">
          Login untuk mengakses akun Anda
        </p>
      </div>

      {/* Row 3: Form */}
      <div className="w-auto flex justify-center items-center mt-[15px]">
        <div className="w-full flex flex-col">

          {/* Error / Warning messages */}
          {error && (
            <div className={`px-[10px] py-[10px] rounded-md mb-[15px] text-[14px] font-montserrat border ${
              error.includes('⚠️')
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-red-100 border-red-300 text-red-800'
            }`}>
              {error}
            </div>
          )}

          {attemptsRemaining !== null && attemptsRemaining > 0 && lockoutSeconds === 0 && (
            <div className="bg-orange-50 border border-orange-300 text-orange-700 px-[10px] py-2 rounded-md mb-[15px] text-[13px] font-montserrat">
              ⚠️ {attemptsRemaining} percobaan tersisa sebelum akun dikunci
            </div>
          )}

          {lockoutSeconds > 0 && (
            <div className="bg-red-100 border border-red-300 text-red-800 px-[10px] py-[10px] rounded-md mb-[15px] text-[14px] font-montserrat text-center">
              🔒 Akun dikunci. Coba lagi dalam{' '}
              <span className="font-bold text-[16px] tracking-wider">
                {Math.floor(lockoutSeconds / 60)}:{String(lockoutSeconds % 60).padStart(2, '0')}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div className="mb-[15px]">
              <label htmlFor="username"
                className="font-montserrat font-semibold text-[#515151] text-[14px] leading-[10px] block">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Masukkan username Anda"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                required
                className="w-full h-10 rounded-md border border-[#D4D4D4] px-3 font-montserrat font-normal text-[14px] leading-6 text-[#515151] mt-[6px] box-border focus:border-[#22C55E] focus:outline-none"
              />
            </div>

            {/* Password */}
            <div className="relative mb-0">
              <label htmlFor="password"
                className="font-montserrat font-semibold text-[#515151] text-[14px] leading-[10px] block">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Masukkan password Anda"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  className="w-full h-10 rounded-md border border-[#D4D4D4] pl-3 pr-11 font-montserrat font-normal text-[14px] leading-6 text-[#515151] mt-[6px] box-border focus:border-[#22C55E] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 bg-transparent border-none cursor-pointer p-[5px] flex items-center justify-center text-[#919191] hover:text-[#22C55E] mt-[6px]"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="font-istok font-normal text-[12px] leading-[18px] text-[#919191] bg-transparent border-none p-0 cursor-pointer inline-block mt-[5px] hover:text-[#515151] hover:underline"
              >
                Lupa password?
              </button>
            </div>

            {/* reCAPTCHA */}
            <div className="my-[15px] flex justify-center scale-95 origin-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey="6Les9mgsAAAAAPDK4yPVWyjHxHl19Eq4IKpmqjB9"
                onChange={onRecaptchaChange}
              />
            </div>

            {/* Submit */}
            <div className="w-full flex flex-col justify-center items-center">
              <button
                type="submit"
                disabled={loading || lockoutSeconds > 0}
                className="w-[250px] h-[35px] rounded-[10px] -mb-[10px] bg-[#22C55E] border-none cursor-pointer font-istok font-bold text-[16px] leading-6 text-white transition-colors duration-200 hover:bg-[#16A34A] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'LOADING...' : 'LOGIN'}
              </button>
              <p className="font-montserrat font-medium text-[#515151] text-[14px] mt-[15px] mb-0">
                Belum punya akun?{' '}
                <a href="/register" className="text-[#22C55E] no-underline font-montserrat font-medium hover:underline">
                  Register!
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
