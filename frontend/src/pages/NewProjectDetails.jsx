
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NewProjectDetails = () => {
  const navigator = useNavigate()
  const [formData, setFormData] = useState({
    projectName: '',
    fundingType: 'reward',
    fundingGoal: '',
    projectDescription: '',
    entrepreneurDetails: '',
    fundingDeadline: '',
    projectDeadline: '',
    coverPhoto: null,
    isGovernmentBacked: 'no'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      coverPhoto: file
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSubmit = new FormData();
  
    formDataToSubmit.append('project_name', formData.projectName);
    formDataToSubmit.append('description', formData.projectDescription);
    formDataToSubmit.append('about_entrepreneur', formData.entrepreneurDetails);
    formDataToSubmit.append('cover_image', formData.coverPhoto);
    formDataToSubmit.append('fund_type', formData.fundingType);
    formDataToSubmit.append('amount', formData.fundingGoal);
    formDataToSubmit.append('project_deadline', formData.projectDeadline);
    formDataToSubmit.append('funding_deadline', formData.fundingDeadline);
  
  
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_GATEWAY_URL}/projects/register`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSubmit, // DO NOT set Content-Type manually, browser will set it automatically
        }
      );
  
      const data = await response.json();
  
      if (data.success) {
        alert('Project submitted successfully!');
        setFormData({
          projectName: '',
          fundingType: 'reward',
          fundingGoal: '',
          projectDescription: '',
          entrepreneurDetails: '',
          fundingDeadline: '',
          projectDeadline: '',
          coverPhoto: null,
        });
        navigator('/member/myprojects');
      } else {
        console.log(data);
        alert(`Failed to submit project: ${data.message}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Project Name</label>
          <input
            type="text"
            name="projectName"
            value={formData.projectName}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your project name"
            required
          />
        </div>

        {/* Funding Type and Goal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Funding Type</label>
            <select
              name="fundingType"
              value={formData.fundingType}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="reward">Reward Based</option>
              <option value="donation">Donation</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Funding Goal</label>
            <input
              type="number"
              name="fundingGoal"
              value={formData.fundingGoal}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your funding goal in INR"
              required
            />
          </div>
        </div>

        {/* Project Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Project Description</label>
          <textarea
            name="projectDescription"
            value={formData.projectDescription}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
            placeholder="Enter the complete Project description and details"
            required
          />
        </div>

        {/* About the Entrepreneur */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">About the Entrepreneur</label>
          <textarea
            name="entrepreneurDetails"
            value={formData.entrepreneurDetails}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
            placeholder="Tell us about yourself and your experience"
            required
          />
        </div>

        {/* Deadlines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Funding deadline</label>
            <input
              type="date"
              name="fundingDeadline"
              value={formData.fundingDeadline}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Project deadline</label>
            <input
              type="date"
              name="projectDeadline"
              value={formData.projectDeadline}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
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
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            accept="image/jpeg,image/png,image/jpg"
            required
          />
          <p className="text-xs text-gray-500">Upload image in jpg/jpeg/png format only</p>
        </div>

        {/* Submit Button */}
        <button 
          type="button"
          onClick={handleSubmit}
          className="w-32 bg-[#5B8FB9] hover:bg-[#4A7A9B] text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
        >
          SUBMIT
        </button>
      </form>
    </div>
  );
};

export default NewProjectDetails;