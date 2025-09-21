import { useNavigate } from 'react-router-dom';
import {Link} from 'react-router-dom';

const StartAProject = () => {
  const navigate = useNavigate();

  const handleStartProject = () => {
    // Add navigation logic here
    navigate('/project-form'); // Adjust the route as needed
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main content section */}
      <div className="max-w-4xl mx-auto pt-16 px-4">
        {/* Hero section with text */}
        <div className="bg-[#201E43] rounded-lg p-8 text-center mb-8">
          <h1 className="text-white text-3xl font-bold leading-tight">
            The best way to predict the future is to create it—
            <br />
            with clean energy.
          </h1>
        </div>

        {/* Start Project Button */}
        <div className="text-center">
        <Link to="/member/newprojectdetails">
          <button
            onClick={handleStartProject}
            className="bg-[#508C9B] hover:bg-[#457a87] text-white font-semibold py-3 px-8 rounded-md transition-colors duration-200"
          >
            Start a Project
          </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StartAProject;