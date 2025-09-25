// import logo from '../../assets/wattTogether_logo.png';
// import {Link} from 'react-router-dom';

// const MemberNavbar = () => {

//     return (
//       <div className='navbar flex items-center justify-between py-3 px-10 lg:flex-row bg-[#508C9B]'>
//           <div>
//             <a href="/member/home" className="text-white font-[inter] text-3xl tracking-wider flex items-center"><img src={logo} alt="platform logo" /></a>
//           </div>

//           <div >
//             {/*for responsiveness add classes in the above div */}
//             <div className="space-x-10">
//               {/* <Link to="/member/home" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">Home</Link> */}
//               <Link to="/member/browsecampaigns" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">Browse Campaigns</Link>
//               <Link to="/member/myinvestments" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">My Investments</Link>
//               <Link to="/member/projects" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">My Projects</Link>
//               <Link to="/member/network" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">Network</Link>
//               <Link to="/member/wallet" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">Wallet</Link>
//               <button className="text-white text-xl hover:underline underline-offset-8 px-5 py-2 font-bold">Logout</button>
//              </div>
//           </div>
//       </div>
//     )
//   }

//   export default MemberNavbar;





import React from 'react';
import logo from '../../assets/wattTogether_logo.png';
import { Link, useNavigate } from 'react-router-dom';

const MemberNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any stored auth tokens or user data from localStorage or other storage
    localStorage.removeItem('authToken'); // adjust key as per your app
    localStorage.removeItem('user'); // adjust key as needed

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
        {/* for responsiveness add classes in the above div */}
        <div className="space-x-10">
          {/* <Link to="/member/home" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">Home</Link> */}
          <Link to="/member/browsecampaigns" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">Browse Campaigns</Link>
          <Link to="/member/myinvestments" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">My Investments</Link>
          <Link to="/member/projects" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">My Projects</Link>
          <Link to="/member/network" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">Network</Link>
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
