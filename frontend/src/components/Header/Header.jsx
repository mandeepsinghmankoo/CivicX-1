import { Container, Logo, Logout } from '../Index'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from 'react';
import NotificationDropdown from '../NotificationDropdown';


function Header() {
  const navigate = useNavigate()
  const authStatus = useSelector((state) => state.auth.status)
  const userData = useSelector((state) => state.auth.userData)
  const computedRole = (userData?.role || userData?.profile?.role || 'citizen')
  const userRole = typeof computedRole === 'string' ? computedRole.toLowerCase() : 'citizen'
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { name: 'Home', slug: '/', active: true },
    { name: 'About', slug: '/about', active: true },
    { name: 'Live Issue', slug: '/liveissues', active: authStatus },
    // Citizen-only: My Issues
    { name: 'My Issues', slug: '/my-issues', active: authStatus && userRole === 'citizen' },
    // Official-only: Manage Issues
    { name: 'Manage Issues', slug: '/manage-issues', active: authStatus && userRole === 'official' },
    { name: 'LogIn', slug: '/login', active: !authStatus },
    { name: 'SignUp', slug: '/signup', active: !authStatus },
  ]

  const avatarInitial = (() => {
    const source = (userData?.name || userData?.profile?.name || userData?.email || 'User').trim();
    return source ? source.charAt(0).toUpperCase() : 'U';
  })();

  return (
    <header className='py-3 shadow-2xl text-green-100 px-4 md:px-30'>
      <Container>
        <nav className='flex items-center justify-between'>
          <div className='mr-4'>
            <Link to='/'>
              <Logo />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <ul className='hidden md:flex ml-auto gap-6 lg:gap-8 items-center'>
            {
              navItems.map((item, i) =>
                item.active ? (
                  <li key={i}>
                    <button
                      onClick={() => navigate(item.slug)}
                      className='text-green-100 text-sm lg:text-lg font-semibold transition-all duration-300 hover:scale-105 flex items-center'
                    >
                      {item.icon ? item.icon : item.name}
                    </button>
                  </li>
                ) : null
              )
            }

            {/* Notifications (only when logged in) */}
            {authStatus && (
              <li>
                <NotificationDropdown />
              </li>
            )}

            {/* Profile Dropdown (only when logged in) */}
            {authStatus && (
              <li className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-10 h-10 rounded-full bg-[#045c65] flex items-center justify-center text-white font-bold hover:scale-105 transition hover:bg-[#067a85]"
                >
                  {avatarInitial}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-[#1a1a1a] shadow-lg rounded-xl overflow-hidden z-50 border border-gray-700">
                    <button
                      onClick={() => navigate("/profile")}
                      className="block w-full text-left px-4 py-2 text-white hover:bg-[#045c65] transition-colors"
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => navigate("/settings")}
                      className="block w-full text-left px-4 py-2 text-white hover:bg-[#045c65] transition-colors"
                    >
                      Settings
                    </button>
                    
                      <Logout />
                    
                  </div>
                )}
              </li>
            )}
          </ul>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-green-100 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-700">
            <ul className='flex flex-col gap-4 pt-4'>
              {
                navItems.map((item, i) =>
                  item.active ? (
                    <li key={i}>
                      <button
                        onClick={() => {
                          navigate(item.slug);
                          setMobileMenuOpen(false);
                        }}
                        className='text-green-100 text-lg font-semibold transition-all duration-300 hover:scale-105 flex items-center w-full text-left'
                      >
                        {item.icon ? item.icon : item.name}
                      </button>
                    </li>
                  ) : null
                )
              }

              {/* Mobile Profile Section */}
              {authStatus && (
                <li className="pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#045c65] flex items-center justify-center text-white font-bold">
                      {avatarInitial}
                    </div>
                    <span className="text-green-100 font-semibold">
                      {userData?.name || userData?.profile?.name || 'User'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setMobileMenuOpen(false);
                      }}
                      className="text-green-100 text-lg hover:text-white transition-colors text-left"
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate("/settings");
                        setMobileMenuOpen(false);
                      }}
                      className="text-green-100 text-lg hover:text-white transition-colors text-left"
                    >
                      Settings
                    </button>
                    <div onClick={() => setMobileMenuOpen(false)}>
                      <Logout />
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        )}
      </Container>
    </header>
  )
}

export default Header
