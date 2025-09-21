import logo from '../../assets/wattTogether_logo.png';
import {Link} from 'react-router-dom';

const MainNavbar = () => {

    return (
      <div className='navbar flex items-center justify-between py-3 px-10 lg:flex-row bg-[#508C9B]'>
          <div>
            <a href="/" className="text-white font-[inter] text-3xl tracking-wider flex items-center"><img src={logo} alt="platform logo" /></a>
          </div>

          <div >
            {/*for responsiveness add classes in the above div */}
            <div className="space-x-10">
              <Link to="/" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">Home</Link>
              <Link to="/howdowework" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">How we Work</Link>
              <Link to="/contactus" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">Contact Us</Link>
              <Link to="/login" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2 font-bold">Login</Link>
             </div>
          </div>
      </div>
    )
  }

  export default MainNavbar;