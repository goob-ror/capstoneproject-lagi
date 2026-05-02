import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import './Sidebar.css';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor" />,
  },
  {
    href: '/data-ibu',
    label: 'Data Ibu',
    icon: <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor" />,
  },
  {
    href: '/kunjungan-anc',
    label: 'Kunjungan ANC',
    icon: <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor" />,
  },
  {
    href: '/persalinan',
    label: 'Persalinan',
    icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" />,
  },
  {
    href: '/kunjungan-nifas',
    label: 'Kunjungan Nifas',
    icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor" />,
  },
  {
    href: '/komplikasi',
    label: 'Komplikasi',
    icon: <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" fill="currentColor" />,
  },
  {
    href: '/posyandu',
    label: 'Posyandu',
    icon: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />,
  },
  {
    href: '/rekapitulasi',
    label: 'Rekapitulasi',
    icon: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="currentColor" />,
  },
  {
    href: '/user-management',
    label: 'Manajemen User',
    icon: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor" />,
  },
  {
    href: '/import-data',
    label: 'Import Data',
    icon: <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor" />,
  },
  {
    href: '/import-draft',
    label: 'Draf Import',
    icon: <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-2 8H7v-2h4v2zm6-4H7v-2h10v2z" fill="currentColor" />,
  },
];

const Sidebar = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => { close(); }, [location.pathname, close]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      if (!e.target.closest('.sidebar') && !e.target.closest('.hamburger-btn')) close();
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, close]);

  useEffect(() => {
    const isMobile = window.innerWidth <= 480;
    document.body.style.overflow = (isOpen && isMobile) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, close]);

  return (
    <>
      {/* ── Hamburger button — shown on tablet & mobile (≤1024px) ── */}
      <button
        className={`hamburger-btn fixed top-[14px] z-[201] w-[42px] h-[42px] bg-white border-none rounded-lg shadow-md cursor-pointer flex-col items-center justify-center gap-[5px] p-0 hover:bg-gray-100 hidden lg:hidden max-lg:flex${isOpen ? ' is-open' : ''}`}
        style={{ left: isOpen && window.innerWidth > 480 ? '294px' : '14px' }}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
        aria-expanded={isOpen}
        aria-controls="app-sidebar"
      >
        <span />
        <span />
        <span />
      </button>

      {/* ── Overlay ── */}
      <div
        className={`sidebar-overlay fixed inset-0 bg-black/45 z-[149] pointer-events-none opacity-0${isOpen ? ' overlay-visible opacity-100 pointer-events-auto' : ''}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* ── Sidebar ── */}
      <aside
        id="app-sidebar"
        style={{
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), width 0.28s cubic-bezier(0.4,0,0.2,1)',
          width: isOpen ? '280px' : undefined,
        }}
        className={[
          'fixed left-0 top-0 z-[150] h-screen bg-white overflow-y-auto overflow-x-hidden flex flex-col',
          // Desktop: always full 280px
          'lg:w-[280px]',
          // Tablet (481–1024px): icon-only 70px strip, expands to 280px when open
          'max-lg:w-[70px]',
          // Mobile (≤480px): off-canvas, slides in when open
          'max-[480px]:w-[280px]',
          isOpen
            ? 'shadow-[4px_0_20px_rgba(0,0,0,0.15)] max-[480px]:translate-x-0'
            : 'shadow-[2px_0_10px_rgba(0,0,0,0.05)] max-[480px]:-translate-x-full',
        ].join(' ')}
        aria-label="Navigasi utama"
      >
        {/* Header */}
        <div className={`border-b border-gray-200 flex items-center gap-3 flex-shrink-0
          ${isOpen ? 'px-5 py-[25px] justify-start' : 'px-3 py-5 lg:px-5 lg:py-[25px] justify-center lg:justify-start'}
        `}>
          <img src="/images/logo-withText.png" alt="iBundaCare Logo" className="w-[45px] h-[45px] flex-shrink-0" />
          <h2 className={`text-[18px] font-bold text-[#22C55E] m-0 whitespace-nowrap overflow-hidden
            ${isOpen ? 'block' : 'hidden lg:block'}
          `}>
            iBundaCare
          </h2>
        </div>

        {/* Nav */}
        <nav className="py-[15px] flex-1 overflow-y-auto overflow-x-hidden pb-5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            return (
              <a
                key={item.href}
                href={item.href}
                title={item.label}
                className={`nav-item flex items-center gap-3 py-3 text-[14px] font-medium font-montserrat whitespace-nowrap overflow-hidden no-underline border-l-[3px] transition-all duration-200
                  ${isActive
                    ? 'active bg-[#ECFDF5] text-[#22C55E]'
                    : 'border-l-transparent text-[#6B7280] hover:bg-gray-50 hover:text-[#22C55E]'
                  }
                  ${isOpen
                    ? 'px-5 justify-start'
                    : 'px-3 justify-center gap-0 lg:px-5 lg:justify-start lg:gap-3'
                  }
                `}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                  {item.icon}
                </svg>
                <span className={`overflow-hidden text-ellipsis ${isOpen ? 'block' : 'hidden lg:block'}`}>
                  {item.label}
                </span>
              </a>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-[15px] py-[15px] border-t border-gray-200 bg-white flex-shrink-0 overflow-hidden">
          <div className={`flex items-center gap-[10px] mb-3 overflow-hidden
            ${isOpen ? 'justify-start' : 'justify-center lg:justify-start'}
          `}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#22C55E] to-[#16A34A] flex items-center justify-center text-white font-bold text-[16px] flex-shrink-0">
              {user?.nama_lengkap?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className={`flex-1 min-w-0 overflow-hidden ${isOpen ? 'block' : 'hidden lg:block'}`}>
              <p className="text-[13px] font-semibold text-gray-900 m-0 whitespace-nowrap overflow-hidden text-ellipsis">
                {user?.nama_lengkap || user?.username}
              </p>
              <p className="text-[11px] text-gray-500 mt-[2px] mb-0 whitespace-nowrap overflow-hidden">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            className={`w-full flex items-center justify-center bg-red-100 text-red-600 border-none rounded-md text-[13px] font-semibold cursor-pointer font-montserrat whitespace-nowrap overflow-hidden hover:bg-red-200 transition-colors duration-200
              ${isOpen ? 'gap-2 px-3 py-2' : 'gap-0 p-2 lg:gap-2 lg:px-3 lg:py-2'}
            `}
            onClick={onLogout}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
            </svg>
            <span className={`overflow-hidden text-ellipsis ${isOpen ? 'block' : 'hidden lg:block'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
