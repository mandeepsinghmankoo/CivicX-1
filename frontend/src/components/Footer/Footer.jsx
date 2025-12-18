import React from 'react'
import { Container } from '../Index'
import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className='bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] text-green-100 py-12 border-t border-gray-700'>
      <Container>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
          {/* About Section */}
          <div className='space-y-4'>
            <h3 className='text-xl font-bold text-white'>CivicX</h3>
            <p className='text-sm text-green-200 leading-relaxed'>
              Empowering communities through technology. Report issues, track progress,
              and make your city better with CivicX.
            </p>
          </div>

          {/* Quick Links */}
          <div className='space-y-4'>
            <h4 className='text-lg font-semibold text-white'>Quick Links</h4>
            <ul className='space-y-2'>
              <li>
                <Link to='/' className='text-sm hover:text-white transition-colors duration-200'>
                  Home
                </Link>
              </li>
              <li>
                <Link to='/about' className='text-sm hover:text-white transition-colors duration-200'>
                  About
                </Link>
              </li>
              <li>
                <Link to='/liveissues' className='text-sm hover:text-white transition-colors duration-200'>
                  Live Issues
                </Link>
              </li>
              <li>
                <Link to='/leaderboard' className='text-sm hover:text-white transition-colors duration-200'>
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className='space-y-4'>
            <h4 className='text-lg font-semibold text-white'>Contact Us</h4>
            <div className='space-y-3'>
              <div className='flex items-center space-x-3'>
                <Mail size={16} className='text-green-400' />
                <span className='text-sm'>support@civicx.com</span>
              </div>
              <div className='flex items-center space-x-3'>
                <Phone size={16} className='text-green-400' />
                <span className='text-sm'>+1 (555) 123-4567</span>
              </div>
              <div className='flex items-center space-x-3'>
                <MapPin size={16} className='text-green-400' />
                <span className='text-sm'>City Hall, Downtown</span>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className='space-y-4'>
            <h4 className='text-lg font-semibold text-white'>Follow Us</h4>
            <div className='flex space-x-4'>
              <a href='#' className='text-green-400 hover:text-white transition-colors duration-200'>
                <Facebook size={20} />
              </a>
              <a href='#' className='text-green-400 hover:text-white transition-colors duration-200'>
                <Twitter size={20} />
              </a>
              <a href='#' className='text-green-400 hover:text-white transition-colors duration-200'>
                <Instagram size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className='mt-8 pt-8 border-t border-gray-700 text-center'>
          <p className='text-sm text-green-300'>
            © {currentYear} CivicX. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  )
}

export default Footer
