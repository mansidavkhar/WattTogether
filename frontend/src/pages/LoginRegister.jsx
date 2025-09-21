import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginRegister = () => {
  // --- STATE MANAGEMENT ---
  const navigate = useNavigate();
  const [state, setState] = useState("Login"); // Manages Login vs. Register view
  const [formData, setFormData] = useState({
    // Simplified form data for a unified 'member'
    name: "",
    email: "",
    password: "",
    pincode: "",
    phone: "",
    interest: [],
    dob: ""
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");


  // --- HANDLERS ---
  const changeHandler = (e) => {
    setError(""); // Clear error on new input
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handles adding interests from the dropdown
  const handleInterestChange = (e) => {
    const value = e.target.value;
    if (value && !formData.interest.includes(value)) {
      setFormData({ ...formData, interest: [...formData.interest, value] });
    }
  };

  // Handles removing an interest tag
  const removeInterest = (valueToRemove) => {
    setFormData({
      ...formData,
      interest: formData.interest.filter((item) => item !== valueToRemove)
    });
  };

  const handleSubmit = async () => {
    if (state === "Register" && !agreedToTerms) {
        setError("You must agree to the terms and policies to continue.");
        return;
    }

    const apiBaseUrl = process.env.VITE_API_GATEWAY_URL;
    const url = state === "Login"
      ? `${apiBaseUrl}/users/login`
      : `${apiBaseUrl}/users/register`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const responseData = await response.json();

        if (responseData.success) {
            localStorage.setItem('token', responseData.token);
            // Since all users are 'members', navigate them to a unified dashboard or project browsing page.
            navigate('/dashboard');
        } else {
            setError(responseData.message || "An error occurred. Please try again.");
        }
    } catch (err) {
        setError("Could not connect to the server. Please check your connection.");
    }
  };


  // --- STYLES ---
  const inputClass = "w-full px-4 py-3 bg-[#EEEEEE] rounded-md font-inter placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#508C9B]";
  const labelClass = "block text-white font-inter text-sm mb-1";


  // --- RENDER ---
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-y-auto">
      {/* Background Gradient & Shape
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#1E2A3B] to-[#141D2B] z-0"></div>
      <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div> */}
      
      {/* Content container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen w-full px-4 my-5">
        {/* Form container */}
        <div className={`w-full ${state === "Login" ? "max-w-lg" : "max-w-lg"} bg-[#201E43]/95 rounded-lg shadow-xl p-8`}>
          <h1 className='text-4xl font-bold text-white text-center mb-6 font-sans tracking-tight'>
            {state === "Login" ? "Welcome Back" : "Join WattTogether"}
          </h1>
          <p className="text-center text-gray-400 mb-8">{state === 'Login' ? 'Sign in to continue your journey.' : 'Create an account to fund the future.'}</p>

          <div className="space-y-6">
            {/* Name field (Register only) */}
            {state === "Register" && (
              <div>
                <label className={labelClass} htmlFor="name">Full Name</label>
                <input id="name" name="name" value={formData.name} onChange={changeHandler} type="text" placeholder="Your Full Name" className={inputClass} required />
              </div>
            )}

            {/* Email field */}
            <div>
              <label className={labelClass} htmlFor="email">Email</label>
              <input id="email" name="email" value={formData.email} onChange={changeHandler} type="email" placeholder="you@example.com" className={inputClass} required />
            </div>

            {/* Password field */}
            <div>
              <label className={labelClass} htmlFor="password">Password</label>
              <input id="password" name="password" value={formData.password} onChange={changeHandler} type="password" placeholder="••••••••" className={inputClass} required />
            </div>

            {/* Register-specific fields */}
            {state === "Register" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass} htmlFor="dob">Date of Birth</label>
                    <input id="dob" name="dob" value={formData.dob} onChange={changeHandler} type="date" className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="phone">Contact Number</label>
                    <input id="phone" name="phone" value={formData.phone} onChange={changeHandler} type="tel" placeholder="Your Phone Number" className={inputClass} required />
                  </div>
                </div>
                
                <div>
                  <label className={labelClass} htmlFor="pincode">Pincode</label>
                  <input id="pincode" name="pincode" value={formData.pincode} onChange={changeHandler} type="text" placeholder="e.g., 400601" className={inputClass} required />
                </div>
                
                <div>
                  <label className={labelClass} htmlFor="interests">Interests in Renewable Energy</label>
                  <select id="interests" onChange={handleInterestChange} className={inputClass}>
                    <option value="">Select an interest to add...</option>
                    <option value="Wind">Wind</option>
                    <option value="Hydroelectricity">Hydroelectricity</option>
                    <option value="Solar Energy">Solar Energy</option>
                    <option value="Biomass">Biomass</option>
                    <option value="Geothermal Energy">Geothermal Energy</option>
                  </select>
                </div>

                {/* Display selected interests as tags */}
                {formData.interest.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                    {formData.interest.map((item) => (
                        <div key={item} className="bg-[#1E4D91]/80 text-white px-3 py-1 rounded-full flex items-center text-sm font-medium">
                        {item}
                        <button onClick={() => removeInterest(item)} className="ml-2 text-white/70 hover:text-white transition-colors">
                            &times;
                        </button>
                        </div>
                    ))}
                    </div>
                )}
              </>
            )}
          </div>
          
          {/* Error Message Display */}
          {error && <p className="text-red-400 text-sm text-center mt-4 bg-red-900/50 p-3 rounded-lg">{error}</p>}

          {/* Terms and conditions */}
          {state === 'Register' && (
            <div className="flex items-start mt-6">
                <input id="terms" type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-500 bg-gray-700 text-[#1E4D91] focus:ring-[#1E4D91]" />
                <label htmlFor="terms" className="ml-3 text-gray-400 text-sm">
                    I agree to the <a href="/terms" className="font-medium text-blue-400 hover:underline">Terms of Service</a> and <a href="/privacy" className="font-medium text-blue-400 hover:underline">Privacy Policy</a>.
                </label>
            </div>
          )}

          {/* Continue button */}
          <button onClick={handleSubmit} className="w-full mt-8 bg-[#508C9B] text-white py-3 rounded-md hover:bg-[#134B70] transition-colors duration-300 uppercase tracking-wider">
            Continue
          </button>

          {/* Toggle between Login/Register */}
          <p className="text-center mt-6 text-gray-400">
            {state === "Register" ? "Already have an account?" : "New to WattTogether?"}
            <span onClick={() => { setState(state === "Login" ? "Register" : "Login"); setError(""); }} className="text-blue-400 font-semibold cursor-pointer hover:underline ml-2">
              {state === "Register" ? "Login" : "Create Account"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;

