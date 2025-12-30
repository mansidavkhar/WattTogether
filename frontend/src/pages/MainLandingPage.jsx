
import LandingQuote from '../components/landing_quote/LandingQuote.jsx';
import FeaturedProjects from '../components/featured_projects/FeaturedProjects.jsx';
import OurMission from '../components/OurMission.jsx';
import MainFeatures from '../components/MainFeatures.jsx';


const MainLandingPage = () => {
  return (
    <div> 
        <LandingQuote />
        <div className='w-[60%] m-auto mb-10'>
          <FeaturedProjects />
        </div>
        <MainFeatures />
        <OurMission />
    </div>
  )
}

export default MainLandingPage