import { Link } from 'react-router-dom';

const Projects = () => {
  const cards = [
    {
      title: 'Start a Campaign',
      description: 'Launch your renewable energy project',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      link: '/member/startacampaign'
    },
    {
      title: 'View my Campaigns',
      description: 'Track active and completed campaigns',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      link: '/member/viewmycampaigns'
    },
    {
      title: 'View my Ongoing Projects',
      description: 'Monitor milestones and release funds',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      link: '/member/myprojects'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Project Management
          </h1>
          <p className="text-gray-500">
            Create and manage your renewable energy campaigns
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          {cards.map((card, index) => (
            <Link 
              key={index}
              to={card.link}
              className="block group"
            >
              <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                      {card.icon}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900 mb-1">
                        {card.title}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {card.description}
                      </p>
                    </div>
                  </div>
                  <svg 
                    className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Projects;