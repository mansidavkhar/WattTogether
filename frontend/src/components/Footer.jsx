// Footer.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useMemberAuth } from '../hooks/useMemberAuth';

const Footer = () => {
  const { authenticated, ready } = useMemberAuth();
  const navigate = useNavigate();

  // Handler for platform links that require authentication
  const handlePlatformClick = (e, path) => {
    e.preventDefault();
    if (authenticated) {
      navigate(path);
    } else {
      navigate('/login');
    }
  };

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
                <Link 
                  to={authenticated ? "/member/home" : "/"} 
                  className="text-gray-300 hover:text-[#508C9B] transition-colors text-sm"
                >
                  Home
                </Link>
              </div>
              <div>
                <Link 
                  to={authenticated ? "/member/howdowework" : "/howdowework"} 
                  className="text-gray-300 hover:text-[#508C9B] transition-colors text-sm"
                >
                  How We Work
                </Link>
              </div>
              <div>
                <Link 
                  to={authenticated ? "/member/contactus" : "/contactus"} 
                  className="text-gray-300 hover:text-[#508C9B] transition-colors text-sm"
                >
                  Contact Us
                </Link>
              </div>
              <div>
                {authenticated ? (
                  <Link to="/member/wallet" className="text-gray-300 hover:text-[#508C9B] transition-colors text-sm">My Wallet</Link>
                ) : (
                  <Link to="/login" className="text-gray-300 hover:text-[#508C9B] transition-colors text-sm">Login</Link>
                )}
              </div>
            </nav>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#508C9B]">Platform</h3>
            <nav className="space-y-2">
              <div>
                <a 
                  href="#" 
                  onClick={(e) => handlePlatformClick(e, '/member/browsecampaigns')}
                  className="text-gray-300 hover:text-[#508C9B] transition-colors text-sm cursor-pointer"
                >
                  Browse Campaigns
                </a>
              </div>
              <div>
                <a 
                  href="#" 
                  onClick={(e) => handlePlatformClick(e, '/member/startacampaign')}
                  className="text-gray-300 hover:text-[#508C9B] transition-colors text-sm cursor-pointer"
                >
                  Start a Campaign
                </a>
              </div>
              <div>
                <a 
                  href="#" 
                  onClick={(e) => handlePlatformClick(e, '/member/myinvestments')}
                  className="text-gray-300 hover:text-[#508C9B] transition-colors text-sm cursor-pointer"
                >
                  My Investments
                </a>
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