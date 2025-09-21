const BrowseProjectsStatic = () => {
  // Sample project data
  const projects = [
    {
      id: 1,
      title: "Solar Farm Project Alpha",
      fundType: "Donation",
      fundingAcquired: 90,
      impactScore: 92,
      daysLeftForFunding: 50,
      image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
      id: 2,
      title: "Community Solar Initiative",
      fundType: "Donation",
      fundingAcquired: 85,
      impactScore: 88,
      daysLeftForFunding: 42,
      image: "https://images.unsplash.com/photo-1497440001374-f26997328c1b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
      id: 3,
      title: "Green Energy Expansion",
      fundType: "Donation",
      fundingAcquired: 77,
      impactScore: 95,
      daysLeftForFunding: 36,
      image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
      id: 4,
      title: "Sustainable Power Hub",
      fundType: "Donation",
      fundingAcquired: 92,
      impactScore: 90,
      daysLeftForFunding: 28,
      image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    }
  ];

  const ProjectCard = ({ project }) => {
    return (
      <div className="bg-white rounded-lg overflow-hidden shadow-lg flex max-w-2xl w-full">
        {/* Project Image */}
        <div className="w-1/2">
          <img
            src={project.image}
            alt={project.title}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Project Details */}
        <div className="w-1/2 bg-slate-800 text-white p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-slate-600 pb-2">
              {project.title}
            </h3>

            {/* Project Stats */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Fund Type</span>
                <span className="text-sm font-medium">{project.fundType}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Funding Acquired</span>
                <span className="text-sm font-medium">{project.fundingAcquired}%</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Impact Score</span>
                <span className="text-sm font-medium">{project.impactScore}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Days Left</span>
                <span className="text-sm font-medium">{project.daysLeftForFunding}</span>
              </div>
            </div>
          </div>

          {/* View Details Button */}
          <div className="mt-6 text-center">
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200">
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Browse Projects</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover and support renewable energy projects that are making a positive impact on our environment
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-8">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-12">
          <button className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200">
            Load More Projects
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrowseProjectsStatic;
