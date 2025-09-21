
import landing_bg from '../../assets/landing_bg.jpg'

const LandingQuote = () => {
  return (
    <div className="bg-cover w-full h-[450px] text-white text-6xl font-semibold flex justify-center items-center text-center px-80 my-2" style={{backgroundImage: `url(${landing_bg})`}}>
        A greener future starts with us-let’s fund it together.
    </div>
  )
}

export default LandingQuote
