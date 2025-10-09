import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NewCampaignDetails = () => {
  const navigator = useNavigate();
  const [isLoading, setIsLoading] = useState(false); // State to track submission status
  const [formData, setFormData] = useState({
    projectName: '',
    fundingGoal: '',
    projectDescription: '',
    entrepreneurDetails: '',
    fundingDeadline: '',
    projectDeadline: '',
    coverPhoto: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({
      ...prev,
      coverPhoto: file,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Disable button and show loading state

    const formDataToSubmit = new FormData();
    formDataToSubmit.append('project_name', formData.projectName);
    formDataToSubmit.append('description', formData.projectDescription);
    formDataToSubmit.append('about_entrepreneur', formData.entrepreneurDetails);
    formDataToSubmit.append('cover_image', formData.coverPhoto);
    formDataToSubmit.append('fund_type', 'donation');
    formDataToSubmit.append('amount', formData.fundingGoal);
    formDataToSubmit.append('project_deadline', formData.projectDeadline);
    formDataToSubmit.append('funding_deadline', formData.fundingDeadline);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_GATEWAY_URL}/campaigns`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSubmit,
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Campaign submitted successfully!');
        navigator('/member/viewmycampaigns');
      } else {
        console.error("Submission failed response:", data);
        alert(`Failed to submit campaign: ${data.message || 'Unknown server error'}`);
      }
    } catch (error) {
      console.error('Submission catch error:', error);
      alert('Something went wrong. Please check the console and try again.');
    } finally {
      setIsLoading(false); // Re-enable button
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
          <input
            type="text"
            name="projectName"
            value={formData.projectName}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your campaign name"
            required
            disabled={isLoading}
          />
        </div>

        {/* Funding Goal */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Funding Goal (INR)</label>
          <input
            type="number"
            name="fundingGoal"
            value={formData.fundingGoal}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your funding goal in INR"
            required
            disabled={isLoading}
          />
        </div>

        {/* Project Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Campaign Description</label>
          <textarea
            name="projectDescription"
            value={formData.projectDescription}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
            placeholder="Enter the complete campaign description and details"
            required
            disabled={isLoading}
          />
        </div>

        {/* About Entrepreneur */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">About the Entrepreneur</label>
          <textarea
            name="entrepreneurDetails"
            value={formData.entrepreneurDetails}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
            placeholder="Tell us about yourself and your experience"
            required
            disabled={isLoading}
          />
        </div>

        {/* Deadlines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Funding Deadline</label>
            <input
              type="date"
              name="fundingDeadline"
              value={formData.fundingDeadline}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Project Deadline</label>
            <input
              type="date"
              name="projectDeadline"
              value={formData.projectDeadline}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Cover Photo Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Upload a cover photo</label>
          <input
            type="file"
            name="coverPhoto"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            accept="image/jpeg,image/png,image/jpg"
            required
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500">Upload image in jpg/jpeg/png format only</p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-32 bg-[#5B8FB9] hover:bg-[#4A7A9B] text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'SUBMIT'}
        </button>
      </form>
    </div>
  );
};

export default NewCampaignDetails;
