// Footer.jsx
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#508C9B] text-white px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Brand Name */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold">WattTogether essentials</h2>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-2">
          <div>
            <Link to="/howdowework" className="text-white hover:text-gray-200 transition-colors">How we Work</Link>
          </div>
          <div>
            <Link to="/contactus" className="text-white hover:text-gray-200 transition-colors">Contact Us</Link>
          </div>
        </nav>

        {/* Copyright */}
        <div className="mt-8 pt-4 border-t border-white text-sm text-center">
          <p>copyright ©WattTogether 2025</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;