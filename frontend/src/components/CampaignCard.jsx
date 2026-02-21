/* eslint-disable react/prop-types */
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { convertINRtoUSDC, convertINRtoEUR, formatCurrency } from '../utils/currencyUtils';

export default function CampaignCard({ campaign }) {
  const navigate = useNavigate();

  const onViewClick = () => {
    navigate(`/member/campaign/${campaign._id}`, { state: { campaign } });
  };

  const BACKEND_URL = import.meta.env.VITE_API_GATEWAY_URL;
  const rawImagePath = campaign.coverImage || campaign.coverImageUrl || campaign.cover_image;
  const baseUrl = BACKEND_URL.replace(/\/api\/?$/, '');

  const imageUrl = rawImagePath
    ? `${baseUrl}${rawImagePath}`
    : `https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop`;

  const title = campaign.title || campaign.project_name || 'Campaign';
  const fundType = campaign.fundingType || campaign.fund_type || 'Donation';
  const fundingGoalRaw = campaign.fundingGoalINR ?? campaign.amount ?? 0;
  const amountRaisedRaw = campaign.amountRaisedINR ?? 0;
  const fundingGoal = Number(fundingGoalRaw) > 0 ? Number(fundingGoalRaw) : 0;
  const amountRaised = Number(amountRaisedRaw) > 0 ? Number(amountRaisedRaw) : 0;
  const fundingPercent = fundingGoal > 0
    ? Math.min(100, Math.round((amountRaised / fundingGoal) * 100))
    : 0;

  const rawDeadline = campaign.fundingDeadline || campaign.funding_deadline;
  let daysLeft = 'N/A';
  if (rawDeadline) {
    const deadline = new Date(rawDeadline);
    const diffMs = deadline - new Date();
    daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  const status = campaign.status || 'active';
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    funded: 'bg-blue-100 text-blue-800',
    completed: 'bg-purple-100 text-purple-800',
    closed: 'bg-gray-100 text-gray-800'
  };

  const description = campaign.description || 'No description available';
  const truncatedDesc = description.length > 100 ? description.substring(0, 100) + '...' : description;

  return (
    <div className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-[#508C9B] flex flex-col h-full">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
          onError={e => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop';
          }}
        />
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status] || statusColors.active}`}>
            {status.toUpperCase()}
          </span>
        </div>
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-gray-800">
            {fundType}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#508C9B] transition-colors">
          {title}
        </h3>
        
        <div className="text-sm text-gray-600 mb-4 line-clamp-2 prose-sm prose-gray max-w-none">
          <ReactMarkdown>{truncatedDesc}</ReactMarkdown>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <div className="font-semibold text-gray-700">
              <div>₹{amountRaised.toLocaleString()}</div>
              <div className="text-xs text-gray-500">${convertINRtoUSDC(amountRaised).toFixed(2)} / €{convertINRtoEUR(amountRaised).toFixed(2)}</div>
            </div>
            <div className="text-right text-gray-500">
              <div>of ₹{fundingGoal.toLocaleString()}</div>
              <div className="text-xs">${convertINRtoUSDC(fundingGoal).toFixed(2)} / €{convertINRtoEUR(fundingGoal).toFixed(2)}</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#508C9B] to-[#134B70] h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${fundingPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{fundingPercent}% funded</span>
            <span>{daysLeft} days left</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 mt-auto">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Backers</p>
            <p className="text-lg font-bold text-gray-800">{campaign.backersCount || 0}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Deadline</p>
            <p className="text-sm font-semibold text-gray-800">
              {rawDeadline ? new Date(rawDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
            </p>
          </div>
        </div>

        {/* View Button */}
        <button
          onClick={onViewClick}
          className="w-full bg-gradient-to-r from-[#134B70] to-[#508C9B] hover:from-[#0d3a54] hover:to-[#3d6f7c] text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
