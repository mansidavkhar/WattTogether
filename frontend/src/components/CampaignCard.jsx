/* eslint-disable react/prop-types */
import { useNavigate } from 'react-router-dom';

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
    : `https://placehold.co/600x400/201E43/FFFFFF?text=${encodeURIComponent(campaign.title || 'Campaign')}`;


  const title = campaign.title || campaign.project_name || 'Campaign';
  const fundType = campaign.fundingType || campaign.fund_type || 'N/A';
  // Support both original backend field and mapped UI field (amount)
  const fundingGoalRaw = campaign.fundingGoalINR ?? campaign.amount ?? 0;
  const amountRaisedRaw = campaign.amountRaisedINR ?? 0;
  const fundingGoal = Number(fundingGoalRaw) > 0 ? Number(fundingGoalRaw) : 0;
  const amountRaised = Number(amountRaisedRaw) > 0 ? Number(amountRaisedRaw) : 0;
  const fundingPercent = fundingGoal > 0
    ? Math.min(100, Math.round((amountRaised / fundingGoal) * 100))
    : 0;

  // Support both camelCase and snake_case from different API mappers
  const rawDeadline = campaign.fundingDeadline || campaign.funding_deadline;
  let daysLeft = 'N/A';
  if (rawDeadline) {
    const deadline = new Date(rawDeadline);
    const diffMs = deadline - new Date();
    daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="w-lg flex h-75 bg-white rounded-2xl shadow-lg overflow-hidden border">
      <div className="w-1/2">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover object-center"
          onError={e => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/600x400/201E43/FFFFFF?text=Invalid+Image';
          }}
        />
      </div>
      <div className="w-1/2 bg-[#201E43] text-white p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm">
            <span className="font-semibold">Fund Type: </span>
            {fundType}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Funding acquired: </span>
            {fundingPercent}%
          </p>
          <p className="text-sm">
            <span className="font-semibold">Impact Score: </span>
            92
          </p>
          <p className="text-sm">
            <span className="font-semibold">Funding Deadline: </span>
            {rawDeadline ? new Date(rawDeadline).toLocaleDateString() : 'N/A'}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Days left for Funding: </span>
            {daysLeft}
          </p>
        </div>
        <button
          onClick={onViewClick}
          className="mt-4 bg-[#508C9B] hover:bg-[#215461] text-white text-sm font-semibold py-2 rounded-lg w-full"
        >
          View Campaign
        </button>
      </div>
    </div>
  );
}
