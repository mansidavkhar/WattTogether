import logo from '../../assets/wattTogether_logo.png';
import { Link, useNavigate } from 'react-router-dom';
import { useWeb3Auth } from '../../context/Web3AuthContext'; // Adjust path as needed

const MemberNavbar = () => {
  const navigate = useNavigate();
  const { disconnectWallet } = useWeb3Auth();

  const handleLogout = async () => {
    // Clear any stored auth tokens or user data from localStorage or other storage
    localStorage.removeItem('authToken'); // adjust key as per your app
    localStorage.removeItem('token');     // JWT
    localStorage.removeItem('id_token');  // Web3Auth JWT if present
    localStorage.removeItem('user');      // user info

    // Call Web3Auth wallet/session disconnect to fully reset wallet
    if (disconnectWallet) {
      await disconnectWallet(); // Await if your logout is asynchronous
    }

    // Redirect to login page or public home page after logout
    navigate('/login');
  };

  return (
    <div className='navbar flex items-center justify-between py-3 px-10 lg:flex-row bg-[#508C9B]'>
      <div>
        <a href="/member/home" className="text-white font-[inter] text-3xl tracking-wider flex items-center">
          <img src={logo} alt="platform logo" />
        </a>
      </div>
      <div>
        <div className="space-x-10">
          <Link to="/member/browsecampaigns" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">Browse Campaigns</Link>
          <Link to="/member/myinvestments" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">My Investments</Link>
          <Link to="/member/projects" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">My Projects</Link>
          <Link to="/member/network" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">Network</Link>
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
