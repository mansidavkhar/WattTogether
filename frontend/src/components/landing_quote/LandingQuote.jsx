
import landing_bg from '../../assets/landing_bg.jpg'
import { Link } from 'react-router-dom'

const LandingQuote = () => {
  return (
    <div className="bg-cover w-full h-[450px] text-white flex flex-col justify-center items-center text-center px-80 my-2 gap-8" style={{backgroundImage: `url(${landing_bg})`}}>
        <h1 className="text-5xl font-semibold">A greener future starts with us-let's fund it together.</h1>
        <Link 
          to="/login" 
          className="bg-[#508C9B] hover:bg-[#3d6f7a] text-white font-semibold px-10 py-4 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-xl"
        >
          Get Started
        </Link>
    </div>
  )
}

export default LandingQuote
