import { Link, useNavigate } from 'react-router-dom';
import { useMemberAuth } from '../hooks/useMemberAuth';
import heroBg from "../assets/how_we_work_bg_image.jpg";

const HowDoWeWork = () => {
  const { authenticated } = useMemberAuth();
  const navigate = useNavigate();

  const handleProtectedNavigation = (e, path) => {
    if (!authenticated) {
      e.preventDefault();
      navigate('/login');
    }
  };
  return (
    <div className="w-full">
      {/* Header Section */}
      <section className="relative h-[300px] md:h-[400px]">
        <img
          src={heroBg}
          alt="How We Work Background"
          className="w-full h-full object-cover object-bottom"
        />
        <div className="absolute inset-0 bg-black opacity-40"></div>

        <div className="absolute inset-0">
          <div className="bg-[#201E43] w-[1000px] px-10 py-18 shadow-xl relative mx-auto mt-[200px]">
            <div className="absolute top-12 left-18 right-18 h-[1px] bg-white px-10"></div>
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
              How We Work
            </h1>
          </div>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="max-w-7xl mx-auto py-16 px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">Our Web2.5 Architecture</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Combining the simplicity of Web2 with the transparency of Web3
          </p>
        </div>

        {/* Blockchain Security Section */}
        <div className="bg-white p-10 rounded-lg shadow-lg mb-16 border border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">How Blockchain Ensures Safety</h3>
          <div className="max-w-4xl mx-auto space-y-6 text-gray-700">
            <p className="leading-relaxed">
              Every transaction on WattTogether is recorded on the Polygon blockchain, creating an immutable and transparent ledger. This ensures that all donations, milestone approvals, and fund releases are permanently documented and cannot be altered or deleted.
            </p>
            <p className="leading-relaxed">
              Smart contracts automatically enforce the rules of each campaign. Funds are locked in escrow until milestones are approved by donors through decentralized voting, eliminating the need for intermediaries and reducing the risk of misuse.
            </p>
            <p className="leading-relaxed">
              Our platform leverages blockchain's inherent security features while maintaining a user-friendly experience. You get the benefits of decentralization - transparency, security, and donor control - without the complexity of managing crypto wallets or paying transaction fees.
            </p>
          </div>
        </div>

        {/* Key Innovations */}
        <div className="bg-[#201E43] text-white p-10 rounded-lg shadow-lg mb-16">
          <h3 className="text-3xl font-semibold mb-8 text-center">Key Innovations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <h4 className="text-xl font-bold mb-3 text-[#508C9B]">Zero Gas Fees</h4>
              <p className="text-gray-700 text-sm">Backend relayer sponsors all transactions. Users never pay gas fees.</p>
            </div>
            <div className="bg-white p-6 rounded-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <h4 className="text-xl font-bold mb-3 text-[#508C9B]">Fiat-First UX</h4>
              <p className="text-gray-700 text-sm">Donate in INR. We handle crypto conversion automatically.</p>
            </div>
            <div className="bg-white p-6 rounded-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <h4 className="text-xl font-bold mb-3 text-[#508C9B]">Passwordless Auth</h4>
              <p className="text-gray-700 text-sm">Magic link login with Privy. Embedded wallets created automatically.</p>
            </div>
            <div className="bg-white p-6 rounded-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <h4 className="text-xl font-bold mb-3 text-[#508C9B]">Milestone Governance</h4>
              <p className="text-gray-700 text-sm">Donors vote on fund releases. Greater than 50% approval required.</p>
            </div>
          </div>
        </div>
      </section>

      {/* User Guides */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-semibold text-gray-800 mb-12 text-center">Navigation Guide</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* For Donors */}
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <div className="mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">For Donors</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-[#508C9B] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0 mt-1">1</div>
                  <div>
                    <h4 className="font-bold text-lg">Sign Up with Email</h4>
                    <p className="text-gray-600">Click <Link to="/login" className="text-[#508C9B] hover:underline font-semibold">"Get Started"</Link> → Enter email → Receive magic link → Auto wallet creation</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-[#508C9B] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0 mt-1">2</div>
                  <div>
                    <h4 className="font-bold text-lg">Browse Campaigns</h4>
                    <p className="text-gray-600">Navigate to <Link to="/member/browsecampaigns" onClick={(e) => handleProtectedNavigation(e, '/member/browsecampaigns')} className="text-[#508C9B] hover:underline font-semibold">"Browse Campaigns"</Link> → Filter by status → View project details</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-[#508C9B] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0 mt-1">3</div>
                  <div>
                    <h4 className="font-bold text-lg">Make Donation</h4>
                    <p className="text-gray-600">Click "Donate" → Enter INR amount → Confirm → Transaction processed (no gas fees!)</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-[#508C9B] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0 mt-1">4</div>
                  <div>
                    <h4 className="font-bold text-lg">Vote on Milestones</h4>
                    <p className="text-gray-600">View campaign milestones → Upvote/Downvote spending requests → Track approvals</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-[#508C9B] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0 mt-1">5</div>
                  <div>
                    <h4 className="font-bold text-lg">Track Investments</h4>
                    <p className="text-gray-600">Go to <Link to="/member/myinvestments" onClick={(e) => handleProtectedNavigation(e, '/member/myinvestments')} className="text-[#508C9B] hover:underline font-semibold">"My Investments"</Link> → View all donations → Check transaction hashes on blockchain</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Creators */}
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <div className="mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">For Creators</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-[#24A232] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0 mt-1">1</div>
                  <div>
                    <h4 className="font-bold text-lg">Complete KYC</h4>
                    <p className="text-gray-600">Navigate to <Link to="/member/kycsubmission" onClick={(e) => handleProtectedNavigation(e, '/member/kycsubmission')} className="text-[#24A232] hover:underline font-semibold">"KYC Submission"</Link> → Upload identity docs → Wait for admin approval</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-[#24A232] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0 mt-1">2</div>
                  <div>
                    <h4 className="font-bold text-lg">Create Campaign</h4>
                    <p className="text-gray-600">Click <Link to="/member/startacampaign" onClick={(e) => handleProtectedNavigation(e, '/member/startacampaign')} className="text-[#24A232] hover:underline font-semibold">"Start a Campaign"</Link> → Fill details → Set funding goal → Contract auto-deploys</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-[#24A232] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0 mt-1">3</div>
                  <div>
                    <h4 className="font-bold text-lg">Monitor Progress</h4>
                    <p className="text-gray-600">View <Link to="/member/viewmycampaigns" onClick={(e) => handleProtectedNavigation(e, '/member/viewmycampaigns')} className="text-[#24A232] hover:underline font-semibold">"My Campaigns"</Link> → Track donations → Check backer count → Real-time updates</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-[#24A232] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0 mt-1">4</div>
                  <div>
                    <h4 className="font-bold text-lg">Submit Milestones</h4>
                    <p className="text-gray-600">Click "Submit Milestone" → Enter amount & description → Donors vote → Wait for approval</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-[#24A232] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0 mt-1">5</div>
                  <div>
                    <h4 className="font-bold text-lg">Release Funds</h4>
                    <p className="text-gray-600">When milestone approved (greater than 50%) → Click "Release Funds" → ETH sent to beneficiary wallet</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Flow */}
      <section className="max-w-5xl mx-auto py-16 px-4 md:px-8">
        <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-center">How Donations Work</h2>
        <div className="bg-white border-2 border-[#508C9B] rounded-lg p-8 shadow-lg">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-[#508C9B] text-white rounded-lg w-12 h-12 flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-lg text-gray-800 mb-1">Submit Your Donation</h4>
                <p className="text-gray-600">Enter the amount you wish to donate in Indian Rupees (INR) through our secure platform.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-[#508C9B] text-white rounded-lg w-12 h-12 flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-lg text-gray-800 mb-1">Automatic Conversion</h4>
                <p className="text-gray-600">Our backend system automatically converts your INR donation to cryptocurrency at the current exchange rate.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-[#508C9B] text-white rounded-lg w-12 h-12 flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-lg text-gray-800 mb-1">Blockchain Transaction</h4>
                <p className="text-gray-600">The relayer wallet processes the transaction on the Polygon blockchain on your behalf - completely gas-free for you.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-[#508C9B] text-white rounded-lg w-12 h-12 flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold text-lg text-gray-800 mb-1">Secure Escrow</h4>
                <p className="text-gray-600">Your donation is locked in a smart contract escrow, ensuring funds are only released when milestones are approved by donors.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-[#508C9B] text-white rounded-lg w-12 h-12 flex items-center justify-center font-bold flex-shrink-0">
                5
              </div>
              <div>
                <h4 className="font-semibold text-lg text-gray-800 mb-1">Transaction Confirmation</h4>
                <p className="text-gray-600">Receive instant confirmation with a transaction hash that you can verify on the blockchain explorer for complete transparency.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600">
              <span className="font-semibold text-[#508C9B]">Result:</span> Your donation is secured on-chain with zero gas fees and full transparency
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowDoWeWork;
