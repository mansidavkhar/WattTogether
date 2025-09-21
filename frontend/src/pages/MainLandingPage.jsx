
import LandingQuote from '../components/landing_quote/LandingQuote.jsx';
import FeaturedProjects from '../components/featured_projects/FeaturedProjects.jsx';
import OurMission from '../components/OurMission.jsx';
import Testimonials from '../components/testimonials/Testimonials.jsx';
//import JoinCommunity from '../components/JoinCommunity.jsx';


const MainLandingPage = () => {
  return (
    <div> 
        <LandingQuote />
        <div className='w-[60%] m-auto mb-10'>
          <FeaturedProjects />
        </div>
        <OurMission />
        <Testimonials />
    </div>
  )
}

export default MainLandingPage