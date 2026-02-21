import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemberAuth } from '../hooks/useMemberAuth';
import CampaignCard from './CampaignCard';
import CardGrid from './CardGrid';

const MyProject = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { getAuthHeader } = useMemberAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const authHeader = await getAuthHeader();
        
        if (!authHeader) {
          setError('Please log in to view your projects');
          setLoading(false);
          return;
        }

        // Fetch user's funded campaigns AND cancelled campaigns
        const res = await fetch(`${import.meta.env.VITE_API_GATEWAY_URL}/campaigns?mine=true&status=funded,cancelled`, {
          method: 'GET',
          headers: {
            Authorization: authHeader,
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const msg = data?.message || res.statusText || `HTTP ${res.status}`;
          throw new Error(msg);
        }

        const data = await res.json();
        if (data.success) {
          setProjects(data.campaigns || []); // campaigns not projects
        } else {
          setError(data.message || 'Failed to load projects');
        }
      } catch (err) {
        setError(err?.message || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []); // getAuthHeader is stable, no need to track it

  const handleManageMilestones = (project) => {
    navigate(`/member/campaign/${project._id}`, { state: { campaign: project } });
  };

  const BACKEND_URL = import.meta.env.VITE_API_GATEWAY_URL;
  const baseUrl = BACKEND_URL.replace(/\/api\/?$/, '');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Ongoing Projects</h1>
          <p className="text-gray-600">Manage milestones and project progress</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#508C9B] mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your projects...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-xl">
            <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No funded projects yet</h3>
            <p className="text-gray-500">Your fully funded campaigns will appear here</p>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && !error && projects.length > 0 && (
          <>
            <div className="mb-6 text-sm text-gray-600">
              Managing <span className="font-semibold text-gray-900">{projects.length}</span> project{projects.length !== 1 ? 's' : ''}
            </div>
            <CardGrid>
              {projects.map((project) => (
                <div key={project._id} className="relative">
                  {project.status === 'cancelled' && (
                    <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-xs font-bold py-1 px-3 rounded-t-lg z-10 text-center">
                      🚨 CANCELLED BY GUARDIAN
                    </div>
                  )}
                  <div className={project.status === 'cancelled' ? 'mt-6 opacity-75 pointer-events-none' : ''}>
                    <CampaignCard campaign={project} />
                  </div>
                  {project.status === 'cancelled' && (
                    <div className="absolute inset-0 bg-red-50 bg-opacity-50 rounded-lg flex items-center justify-center">
                      <div className="bg-white border-2 border-red-500 rounded-lg p-4 shadow-lg max-w-xs mx-4">
                        <p className="text-red-800 font-semibold text-sm text-center">
                          This project was terminated. Donors can claim refunds.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardGrid>
          </>
        )}
      </div>
    </div>
  );
};

export default MyProject;
