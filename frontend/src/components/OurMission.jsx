
import our_mission_img from '../assets/our_mission_image.jpg'
const OurMission = () => {
    return (
      <div className='w-[60%] m-auto mb-10'>
          <p className="font-black font-[inter] text-3xl text-center py-5 mt-15 underline underline-offset-8">Our Mission</p>

          <div className="flex justify-between mb-10">
            <div className="rounded-t-xl">
                <img src={our_mission_img} className="rounded-full border-2 border-black" alt="" />
            </div>

            <div className='px-10 py-5'>
                <p className='py-2'>We empower changemakers to launch and fund renewable energy projects through a decentralized crowdfunding platform built on transparency and trust.</p>
                <p className='py-2'>From community-led solar grids to rural electrification, our platform connects funders with high-impact green initiatives using blockchain-based milestone tracking and DAO-style voting.</p>
                <p className='py-2'>By minimizing fees, eliminating gatekeepers, and enabling real-time project accountability, we make sustainable energy funding simple, secure, and community-driven.</p>
            </div>
          </div>
      </div>
    )
  }
  
  export default OurMission