
import heroBg from "../assets/how_we_work_bg_image.jpg";

const HowDoWeWork = () => {
  return (
    <div className="w-full">
      {/* Header Section */}
      <section className="relative h-[300px] md:h-[400px]">
        <img
          src={heroBg}
          alt="How We Work Background"
          className="w-full h-full object-cover object-bottom"
        />
        {/* Dark overlay */}
        { <div className="absolute inset-0 bg-black opacity-40"></div> } 
      

{/* Centered Box with dark background */}
<div className="absolute inset-0 ">
  <div className="bg-[#201E43] w-[1000px] px-10 py-18 shadow-xl relative mx-auto mt-[200px]">
    {/* Top white line */}
    <div className="absolute top-12 left-18 right-18 h-[1px] bg-white px-10"></div>
    
    {/* Bottom white line */}
    <div className="absolute bottom-12 left-18 right-18 h-[1px] bg-white"></div>

    <h1
      className="text-white text-[32px] relative z-10 px-8"
      style={{ 
        fontFamily: "Playfair Display", 
        fontWeight: 400,
        letterSpacing: "0.05em",
        lineHeight: "42.67px"
      }}
    >
      How we Work
    </h1>
  </div>
</div>      
</section>
      {/* Content Section */}
      <section className="max-w-5xl mx-auto py-35 px-4 md:px-8">
        <p className="mb-8 text-lg text-gray-700">
          We believe in making renewable energy funding simple, transparent, and impactful.
          Here’s how our platform empowers innovators and investors:
        </p>

        <div className="space-y-12">
          {/* Step 1 */}
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              1. Connecting Innovators & Investors
            </h2>
            <p className="text-gray-600">
              Entrepreneurs, from small startups to large enterprises, can showcase their renewable
              energy projects to a global community of investors. Our platform fosters collaboration,
              helping projects secure the funding they need.
            </p>
          </div>

          {/* Step 2 */}
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              2. Flexible Funding Models
            </h2>
            <p className="text-gray-600 mb-2">
              We offer diverse funding options to match different project needs:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>
                <span className="font-medium">Donation-based:</span> Support impactful projects with no financial return.
              </li>
              <li>
                <span className="font-medium">Reward-based:</span> Fund projects in exchange for perks or services.
              </li>
              <li>
                <span className="font-medium">Equity-based:</span> Invest in projects and gain a share in their success.
              </li>
            </ul>
          </div>

          {/* Step 3 */}
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              3. Transparent & Secure Platform
            </h2>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>
                <span className="font-medium">Real-Time Tracking:</span> Monitor project progress through live updates.
              </li>
              <li>
                <span className="font-medium">Impact-Driven Rating System:</span> Social and rural projects with higher impact scores receive greater visibility.
              </li>
              <li>
                <span className="font-medium">Secure Payments:</span> Reliable and transparent transactions ensure funds are safely transferred.
              </li>
            </ul>
          </div>

          {/* Step 4 */}
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              4. Affordable & Success-Based Pricing
            </h2>
            <p className="text-gray-600 mb-2">
              Our "Fee on Success" model ensures fair pricing:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>
                <span className="font-medium">0% Fee:</span> For small, community-driven projects.
              </li>
              <li>
                <span className="font-medium">3.5% Fee + Payment Processing Fee:</span> Charged only for successfully funded projects following the "All-or-Nothing" model.
              </li>
            </ul>
          </div>

          {/* Step 5 */}
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              5. Government & Community Support
            </h2>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>
                <span className="font-medium">Government-Backed Crowdfunding Model:</span> Users can donate funds into government-supported renewable initiatives.
              </li>
              <li>
                <span className="font-medium">Local Impact Projects:</span> Prioritizing village electrification, urban solar panel installations, and other sustainability-driven initiatives.
              </li>
            </ul>
          </div>

          {/* Step 6 */}
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              6. Tools for Transparency & Growth
            </h2>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>
                <span className="font-medium">Real-Time Impact Dashboard:</span> Track energy generation, CO₂ reduction, and cost savings live.
              </li>
              <li>
                <span className="font-medium">Networking Platform:</span> Connect with like-minded investors, entrepreneurs, and renewable energy professionals to foster collaborations.
              </li>
            </ul>
          </div>
        </div>
      </section>
</div>
    
  );
};

export default HowDoWeWork;