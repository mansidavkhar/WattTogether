// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// const LoginRegister = () => {
//   // --- STATE MANAGEMENT ---
//   const navigate = useNavigate();
//   const [state, setState] = useState("Login"); // Manages Login vs. Register view
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     pincode: "",
//     phone: "",
//     interest: [],
//     dob: ""
//   });
//   const [agreedToTerms, setAgreedToTerms] = useState(false);
//   const [error, setError] = useState("");


//   // --- HANDLERS ---
//   const changeHandler = (e) => {
//     setError(""); // Clear error on new input
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleInterestChange = (e) => {
//     const value = e.target.value;
//     if (value && !formData.interest.includes(value)) {
//       setFormData({ ...formData, interest: [...formData.interest, value] });
//     }
//   };

//   const removeInterest = (valueToRemove) => {
//     setFormData({
//       ...formData,
//       interest: formData.interest.filter((item) => item !== valueToRemove)
//     });
//   };

//   const handleSubmit = async () => {
//     if (state === "Register" && !agreedToTerms) {
//         setError("You must agree to the terms and policies to continue.");
//         return;
//     }

//     // In a Vite project, the correct way is import.meta.env.VITE_API_GATEWAY_URL.
//     // If you encounter build warnings about the target environment, it may be a project configuration issue.
//     // For now, we are hardcoding the URL to ensure functionality.
//     const apiBaseUrl = "http://localhost:5000"; 
    
//     const url = state === "Login"
//       ? `${apiBaseUrl}/api/members/login`
//       : `${apiBaseUrl}/api/members/register`;

//     try {
//         const response = await fetch(url, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(formData),
//         });

//         const responseData = await response.json();

//         if (responseData.success) {
//             localStorage.setItem('token', responseData.token);
//             navigate('/member/home');
//         } else {
//             setError(responseData.message || "An error occurred. Please try again.");
//         }
//     } catch (err) {
//         setError("Could not connect to the server. Please check your connection.");
//         console.error("Fetch Error:", err);
//     }
//   };


//   // --- STYLES (Your original styling is preserved) ---
//   const inputClass = "w-full px-4 py-3 bg-[#EEEEEE] rounded-md font-inter placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#508C9B]";
//   const labelClass = "block text-white font-inter text-sm mb-1";


//   // --- RENDER (Your original JSX is preserved) ---
//   return (
//     <div className="relative w-full min-h-screen flex items-center justify-center overflow-y-auto">
//       {/*Content Container*/}
//       <div className="relative z-10 flex items-center justify-center min-h-screen w-full px-4 my-5">
//         {/* Form container */}
//         <div className={`w-full ${state === "Login" ? "max-w-lg" : "max-w-lg"} bg-[#201E43]/95 rounded-lg shadow-xl p-8`}>
//           <h1 className='text-4xl font-bold text-white text-center mb-6 font-sans tracking-tight'>
//             {state === "Login" ? "Welcome Back" : "Join WattTogether"}
//           </h1>
//           <p className="text-1xl text-white text-center mb-8">{state === 'Login' ? 'Sign in to continue your journey.' : 'Create an account to fund the future.'}</p>

//           <div className="space-y-6">
//             {/* Name field (Register only) */}
//             {state === "Register" && (
//               <div>
//                 <label className={labelClass} htmlFor="name">Full Name</label>
//                 <input id="name" name="name" value={formData.name} onChange={changeHandler} type="text" placeholder="Your Full Name" className={inputClass} required />
//               </div>
//             )}

//             {/* Email field */}
//             <div>
//               <label className={labelClass} htmlFor="email">Email</label>
//               <input id="email" name="email" value={formData.email} onChange={changeHandler} type="email" placeholder="you@example.com" className={inputClass} required />
//             </div>

//             {/* Password field */}
//             <div>
//               <label className={labelClass} htmlFor="password">Password</label>
//               <input id="password" name="password" value={formData.password} onChange={changeHandler} type="password" placeholder="••••••••" className={inputClass} required />
//             </div>

//             {/* Register-specific fields */}
//             {state === "Register" && (
//               <>
//                 <div className="grid grid-cols-2 md:grid-cols-2 gap-5">
//                   <div>
//                     <label className={labelClass} htmlFor="dob">Date of Birth</label>
//                     <input id="dob" name="dob" value={formData.dob} onChange={changeHandler} type="date" className={inputClass} required />
//                   </div>
//                   <div>
//                     <label className={labelClass} htmlFor="phone">Contact Number</label>
//                     <input id="phone" name="phone" value={formData.phone} onChange={changeHandler} type="tel" placeholder="Your Phone Number" className={inputClass} required />
//                   </div>
//                 </div>
                
//                 <div>
//                   <label className={labelClass} htmlFor="pincode">Pincode</label>
//                   <input id="pincode" name="pincode" value={formData.pincode} onChange={changeHandler} type="text" placeholder="e.g., 400601" className={inputClass} required />
//                 </div>
                
//                 <div>
//                   <label className={labelClass} htmlFor="interests">Interests in Renewable Energy</label>
//                   <select id="interests" onChange={handleInterestChange} className={inputClass}>
//                     <option value="">Select an interest to add...</option>
//                     <option value="Wind">Wind</option>
//                     <option value="Hydroelectricity">Hydroelectricity</option>
//                     <option value="Solar Energy">Solar Energy</option>
//                     <option value="Biomass">Biomass</option>
//                     <option value="Geothermal Energy">Geothermal Energy</option>
//                   </select>
//                 </div>

//                 {/* Display selected interests as tags */}
//                 {formData.interest.length > 0 && (
//                     <div className="flex flex-wrap gap-2 pt-2">
//                     {formData.interest.map((item) => (
//                         <div key={item} className="bg-[#508C9B] text-white px-3 py-1 rounded-full flex items-center">
//                         {item}
//                         <button onClick={() => removeInterest(item)} className="ml-2 text-white/70 hover:text-white transition-colors">
//                             &times;
//                         </button>
//                         </div>
//                     ))}
//                     </div>
//                 )}
//               </>
//             )}
//           </div>
          
//           {/* Error Message Display */}
//           {error && <p className="text-red-400 text-sm text-center mt-4 bg-red-900/50 p-3 rounded-lg">{error}</p>}

//           {/* Terms and conditions */}
//           {state === 'Register' && (
//             <div className="flex items-start mt-6">
//                 <input id="terms" type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-500 bg-gray-700 text-[#1E4D91] focus:ring-[#1E4D91]" />
//                 <label htmlFor="terms" className="ml-3 text-gray-400 text-sm">
//                     I agree to the <a href="/terms" className="font-medium text-blue-400 hover:underline">Terms of Service</a> and <a href="/privacy" className="font-medium text-blue-400 hover:underline">Privacy Policy</a>.
//                 </label>
//             </div>
//           )}

//           {/* Continue button */}
//           <button onClick={handleSubmit} className="w-full mt-8 bg-[#508C9B] text-white py-3 rounded-md hover:bg-[#134B70] transition-colors duration-300 uppercase tracking-wider">
//             Continue
//           </button>

//           {/* Toggle between Login/Register */}
//           <p className="text-center mt-6 text-gray-400">
//             {state === "Register" ? "Already have an account?" : "New to WattTogether?"}
//             <span onClick={() => { setState(state === "Login" ? "Register" : "Login"); setError(""); }} className="text-blue-400 font-semibold cursor-pointer hover:underline ml-2">
//               {state === "Register" ? "Login" : "Create Account"}
//             </span>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginRegister;

















import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginRegister = () => {
  // --- STATE MANAGEMENT ---
  const navigate = useNavigate();
  const [state, setState] = useState("Login"); // Manages Login vs. Register view
  const [formData, setFormData] = useState({
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
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  // --- HANDLERS ---
  const changeHandler = (e) => {
    setError(""); // Clear error on new input
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInterestChange = (e) => {
    const value = e.target.value;
    if (value && !formData.interest.includes(value)) {
      setFormData({ ...formData, interest: [...formData.interest, value] });
    }
  };

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

    setIsLoading(true);
    setError("");

    const apiBaseUrl = "http://localhost:5000"; 
    const url = state === "Login"
      ? `${apiBaseUrl}/api/members/login`
      : `${apiBaseUrl}/api/members/register`;

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
        // Store BOTH tokens for Web3Auth compatibility
        localStorage.setItem('token', responseData.token);
        
        if (responseData.id_token) {
          localStorage.setItem('id_token', responseData.id_token);
          console.log('✅ Both tokens stored successfully');
          console.log('Regular token:', responseData.token ? 'Present' : 'Missing');
          console.log('ID token (Web3Auth):', responseData.id_token ? 'Present' : 'Missing');
        } else {
          console.warn('⚠️ ID token missing from server response');
        }

        // Store user info if provided
        if (responseData.user) {
          localStorage.setItem('user', JSON.stringify(responseData.user));
        }

        // Navigate to member home
        navigate('/member/home');
      } else {
        setError(responseData.message || "An error occurred. Please try again.");
      }
    } catch (err) {
      setError("Could not connect to the server. Please check your connection.");
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- STYLES (Your original styling is preserved) ---
  const inputClass = "w-full px-4 py-3 bg-[#EEEEEE] rounded-md font-inter placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#508C9B]";
  const labelClass = "block text-white font-inter text-sm mb-1";

  // --- RENDER (Your original JSX is preserved) ---
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-y-auto">
      {/*Content Container*/}
      <div className="relative z-10 flex items-center justify-center min-h-screen w-full px-4 my-5">
        {/* Form container */}
        <div className={`w-full ${state === "Login" ? "max-w-lg" : "max-w-lg"} bg-[#201E43]/95 rounded-lg shadow-xl p-8`}>
          <h1 className='text-4xl font-bold text-white text-center mb-6 font-sans tracking-tight'>
            {state === "Login" ? "Welcome Back" : "Join WattTogether"}
          </h1>
          <p className="text-1xl text-white text-center mb-8">
            {state === 'Login' ? 'Sign in to continue your journey.' : 'Create an account to fund the future.'}
          </p>

          <div className="space-y-6">
            {/* Name field (Register only) */}
            {state === "Register" && (
              <div>
                <label className={labelClass} htmlFor="name">Full Name</label>
                <input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={changeHandler} 
                  type="text" 
                  placeholder="Your Full Name" 
                  className={inputClass} 
                  required 
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Email field */}
            <div>
              <label className={labelClass} htmlFor="email">Email</label>
              <input 
                id="email" 
                name="email" 
                value={formData.email} 
                onChange={changeHandler} 
                type="email" 
                placeholder="you@example.com" 
                className={inputClass} 
                required 
                disabled={isLoading}
              />
            </div>

            {/* Password field */}
            <div>
              <label className={labelClass} htmlFor="password">Password</label>
              <input 
                id="password" 
                name="password" 
                value={formData.password} 
                onChange={changeHandler} 
                type="password" 
                placeholder="••••••••" 
                className={inputClass} 
                required 
                disabled={isLoading}
              />
            </div>

            {/* Register-specific fields */}
            {state === "Register" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass} htmlFor="dob">Date of Birth</label>
                    <input 
                      id="dob" 
                      name="dob" 
                      value={formData.dob} 
                      onChange={changeHandler} 
                      type="date" 
                      className={inputClass} 
                      required 
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="phone">Contact Number</label>
                    <input 
                      id="phone" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={changeHandler} 
                      type="tel" 
                      placeholder="Your Phone Number" 
                      className={inputClass} 
                      required 
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div>
                  <label className={labelClass} htmlFor="pincode">Pincode</label>
                  <input 
                    id="pincode" 
                    name="pincode" 
                    value={formData.pincode} 
                    onChange={changeHandler} 
                    type="text" 
                    placeholder="e.g., 400601" 
                    className={inputClass} 
                    required 
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label className={labelClass} htmlFor="interests">Interests in Renewable Energy</label>
                  <select 
                    id="interests" 
                    onChange={handleInterestChange} 
                    className={inputClass}
                    disabled={isLoading}
                  >
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
                      <div key={item} className="bg-[#508C9B] text-white px-3 py-1 rounded-full flex items-center">
                        {item}
                        <button 
                          onClick={() => removeInterest(item)} 
                          className="ml-2 text-white/70 hover:text-white transition-colors"
                          disabled={isLoading}
                        >
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
          {error && (
            <div className="mt-4 bg-red-900/50 border border-red-500 p-3 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Success Message Display */}
          {isLoading && (
            <div className="mt-4 bg-blue-900/50 border border-blue-500 p-3 rounded-lg">
              <p className="text-blue-400 text-sm text-center">
                {state === "Login" ? "Signing in..." : "Creating account..."} Please wait.
              </p>
            </div>
          )}

          {/* Terms and conditions */}
          {state === 'Register' && (
            <div className="flex items-start mt-6">
              <input 
                id="terms" 
                type="checkbox" 
                checked={agreedToTerms} 
                onChange={(e) => setAgreedToTerms(e.target.checked)} 
                className="mt-1 h-4 w-4 rounded border-gray-500 bg-gray-700 text-[#1E4D91] focus:ring-[#1E4D91]"
                disabled={isLoading}
              />
              <label htmlFor="terms" className="ml-3 text-gray-400 text-sm">
                I agree to the <a href="/terms" className="font-medium text-blue-400 hover:underline">Terms of Service</a> and <a href="/privacy" className="font-medium text-blue-400 hover:underline">Privacy Policy</a>.
              </label>
            </div>
          )}

          {/* Continue button */}
          <button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className={`w-full mt-8 py-3 rounded-md transition-colors duration-300 uppercase tracking-wider ${
              isLoading 
                ? "bg-gray-600 text-gray-400 cursor-not-allowed" 
                : "bg-[#508C9B] text-white hover:bg-[#134B70]"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {state === "Login" ? "Signing In..." : "Creating Account..."}
              </div>
            ) : (
              "Continue"
            )}
          </button>

          {/* Toggle between Login/Register */}
          <p className="text-center mt-6 text-gray-400">
            {state === "Register" ? "Already have an account?" : "New to WattTogether?"}
            <span 
              onClick={() => { 
                if (!isLoading) {
                  setState(state === "Login" ? "Register" : "Login"); 
                  setError(""); 
                }
              }} 
              className={`font-semibold ml-2 ${
                isLoading 
                  ? "text-gray-600 cursor-not-allowed" 
                  : "text-blue-400 cursor-pointer hover:underline"
              }`}
            >
              {state === "Register" ? "Login" : "Create Account"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;
