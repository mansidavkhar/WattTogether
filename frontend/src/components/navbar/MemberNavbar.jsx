import logo from '../../assets/wattTogether_logo.png';
import { Link, useNavigate } from 'react-router-dom';
import { useMemberAuth } from '../../hooks/useMemberAuth';

const MemberNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useMemberAuth();

  const handleLogout = async () => {
    // Logout will clear localStorage and Privy session
    await logout();
    
    // Redirect to login page
    navigate('/login');
  };

  return (
    <div className='navbar flex items-center justify-between py-3 px-10 lg:flex-row bg-[#508C9B]'>
      <div>
        <Link to="/member/home" className="text-white font-[inter] text-3xl tracking-wider flex items-center">
          <img src={logo} alt="platform logo" />
        </Link>
      </div>
      <div>
        <div className="space-x-10">
          <Link to="/member/browsecampaigns" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">Browse Campaigns</Link>
          <Link to="/member/myinvestments" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">My Investments</Link>
          <Link to="/member/projects" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">My Projects</Link>
          {/* 🚫 Network feature disabled for V2 */}
          {/* <Link to="/member/network" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">Network</Link> */}
          {/* Remove wallet page link if you fully auto-create wallet on registration */}
          <Link to="/member/wallet" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">Wallet</Link>
          <button
            onClick={handleLogout}
            className="text-white text-xl hover:underline underline-offset-8 px-5 py-2 font-bold"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberNavbar;
