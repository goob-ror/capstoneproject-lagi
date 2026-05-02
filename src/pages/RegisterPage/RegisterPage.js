import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import RegisterPresenter from './RegisterPage-presenter';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const [presenter] = useState(() => new RegisterPresenter({
    setLoading,
    setError: (msg) => setError(msg),
    clearError: () => setError(''),
    onRegisterSuccess: () => navigate('/waiting-approval'),
    navigateToLogin: () => navigate('/login')
  }));

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recaptchaToken) {
      setError('Silakan verifikasi bahwa Anda bukan robot.');
      return;
    }
    presenter.handleRegister({ ...formData, recaptchaToken });
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
      setRecaptchaToken(null);
    }
  };

  const onRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="flex flex-row items-center justify-center w-[900px] max-w-[96vw] min-h-[600px] rounded-[25px] bg-white box-border">

      {/* Left: Image panel — hidden on small screens */}
      <div
        className="hidden md:block w-[400px] min-h-[600px] h-full rounded-[25px_0_0_25px] relative bg-cover bg-[60%_50%] flex-shrink-0"
        style={{ backgroundImage: "url('/images/mothers-health.png')" }}
      >
        <button
          className="p-5 bg-transparent border-none cursor-pointer flex items-center justify-center"
          type="button"
          aria-label="Go back"
          onClick={handleBack}
        >
          <svg width="13" height="21" viewBox="0 0 13 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M10.3333 20.6667L0 10.3333L10.3333 1.90735e-06L12.9167 2.58334L5.16667 10.3333L12.9167 18.0833L10.3333 20.6667Z" fill="#22C55E"/>
          </svg>
        </button>
      </div>

      {/* Right: Form panel */}
      <div className="flex flex-col justify-center items-center w-full md:w-[500px] h-full px-5 py-[30px] box-border">

        {/* Back button visible only on mobile */}
        <div className="md:hidden w-full mb-2">
          <button
            className="p-5 -ml-5 bg-transparent border-none cursor-pointer flex items-center justify-center"
            type="button"
            aria-label="Go back"
            onClick={handleBack}
          >
            <svg width="13" height="21" viewBox="0 0 13 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M10.3333 20.6667L0 10.3333L10.3333 1.90735e-06L12.9167 2.58334L5.16667 10.3333L12.9167 18.0833L10.3333 20.6667Z" fill="#22C55E"/>
            </svg>
          </button>
        </div>

        {/* Logo + heading */}
        <div className="w-full flex flex-col items-center text-center">
          <img src="/images/logo-withText.png" alt="iBundaCare Logo" className="w-[70px] h-[74px]" />
          <h1 className="font-montserrat font-bold text-[20px] text-[#515151] mt-[15px] mb-[5px]">
            Selamat Datang!
          </h1>
          <p className="font-istok font-normal text-[13px] text-[#515151] m-0 leading-[18px]">
            Buat akun untuk mulai mendata pasien di Puskesmas Palaran
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full mt-5">

          {error && (
            <div className="bg-red-100 border border-red-300 text-red-800 px-[10px] py-[10px] rounded-md mb-[15px] text-[14px] font-montserrat">
              {error}
            </div>
          )}

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
          <div className="mb-[15px]">
            <label htmlFor="password"
              className="font-montserrat font-semibold text-[#515151] text-[14px] leading-[10px] block">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Masukkan password Anda (min. 6 karakter)"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
                className="w-full h-10 rounded-md border border-[#D4D4D4] pl-3 pr-11 font-montserrat font-normal text-[14px] leading-6 text-[#515151] mt-[6px] box-border focus:border-[#22C55E] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 bg-transparent border-none cursor-pointer p-[5px] flex items-center justify-center text-[#919191] hover:text-[#515151] mt-[6px]"
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
          <div className="w-full flex flex-col justify-center items-center mt-[10px]">
            <button
              type="submit"
              disabled={loading}
              className="w-[250px] h-[35px] rounded-[10px] bg-[#22C55E] border-none cursor-pointer font-istok font-bold text-[16px] leading-6 text-white transition-colors duration-200 hover:bg-[#16A34A] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'LOADING...' : 'REGISTER'}
            </button>
            <p className="font-montserrat font-medium text-[#515151] text-[14px] mt-[15px] mb-0">
              Sudah punya akun?{' '}
              <a href="/login" className="text-[#22C55E] no-underline font-montserrat font-medium hover:underline">
                Login!
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
