// Footer.jsx
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#201E43] text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <h2 className="text-2xl font-bold mb-4">WattTogether</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Empowering renewable energy through decentralized crowdfunding.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#508C9B]">Quick Links</h3>
            <nav className="space-y-2">
              <div>
                <Link to="/" className="text-gray-300 hover:text-[#508C9B] transition-colors text-sm">Home</Link>
              </div>
              <div>
                <Link to="/howdowework" className="text-gray-300 hover:text-[#508C9B] transition-colors text-sm">How We Work</Link>
              </div>
              <div>
                <Link to="/contactus" className="text-gray-300 hover:text-[#508C9B] transition-colors text-sm">Contact Us</Link>
              </div>
              <div>
                <Link to="/login" className="text-gray-300 hover:text-[#508C9B] transition-colors text-sm">Login</Link>
              </div>
            </nav>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#508C9B]">Platform</h3>
            <nav className="space-y-2">
              <div>
                <Link to="/login" className="text-gray-300 hover:text-[#508C9B] transition-colors text-sm">Browse Campaigns</Link>
              </div>
              <div>
                <Link to="/login" className="text-gray-300 hover:text-[#508C9B] transition-colors text-sm">Start a Campaign</Link>
              </div>
              <div>
                <Link to="/login" className="text-gray-300 hover:text-[#508C9B] transition-colors text-sm">My Investments</Link>
              </div>
            </nav>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#508C9B]">Support</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>Building a sustainable future together.</p>
              <p className="pt-2">Powered by blockchain technology on Polygon.</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">© 2025 WattTogether. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-[#508C9B] transition-colors text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-[#508C9B] transition-colors text-sm">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;