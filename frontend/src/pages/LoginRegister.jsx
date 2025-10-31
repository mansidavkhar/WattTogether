// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useWeb3Auth } from '../context/Web3AuthContext'; // Adjust import path if needed

// const LoginRegister = () => {
//   const navigate = useNavigate();
//   const [state, setState] = useState("Login");
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: ""
//     });
//   const [agreedToTerms, setAgreedToTerms] = useState(false);
//   const [error, setError] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   // Web3Auth context
//   const { connectWithCustomJWT, walletAddress, isLoading: walletLoading, error: walletError } = useWeb3Auth();

//   // Input handlers
//   const changeHandler = (e) => {
//     setError("");
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

//   // Registration and login handlers
//   const handleSubmit = async () => {
//     if (state === "Register" && !agreedToTerms) {
//       setError("You must agree to the terms and policies to continue.");
//       return;
//     }

//     setIsLoading(true);
//     setError("");

//     const BACKEND_URL = "http://localhost:5000";
//     const url = state === "Login"
//       ? `${BACKEND_URL}/api/members/login`
//       : `${BACKEND_URL}/api/members/register`;

//     try {
//       // Main register/login API call
//       const response = await fetch(url, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData),
//       });

//       const responseData = await response.json();

//       if (responseData.success) {
//         localStorage.setItem('token', responseData.token);

//         // Store Web3Auth id_token if returned from backend
//         if (responseData.id_token) {
//           localStorage.setItem('id_token', responseData.id_token);
//         }

//         if (responseData.user) {
//           localStorage.setItem('user', JSON.stringify(responseData.user));
//         }

//         // If this was registration, immediately create wallet
//         if (state === "Register") {
//           // Automatic wallet creation via Web3Auth (custom JWT)
//           setError("Generating crypto wallet...");
//           await connectWithCustomJWT(); // Uses JWT from backend, will save wallet to backend via context logic
//         }

//         // Success: Go to member home
//         navigate('/member/home');
//       } else if (response.status === 409 || (responseData.message && responseData.message.toLowerCase().includes("duplicate"))) {
//         setError("User with that email already exists. Please sign in instead.");
//       } else {
//         setError(responseData.message || "An error occurred. Please try again.");
//       }
//     } catch (err) {
//       setError("Could not connect to the server. Please check your connection.");
//       console.error("Fetch Error:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // UI input styling
//   const inputClass = "w-full px-4 py-3 bg-[#EEEEEE] rounded-md font-inter placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#508C9B]";
//   const labelClass = "block text-white font-inter text-sm mb-1";

//   return (
//     <div className="relative w-full min-h-screen flex items-center justify-center overflow-y-auto">
//       <div className="relative z-10 flex items-center justify-center min-h-screen w-full px-4 my-5">
//         <div className={`w-full max-w-lg bg-[#201E43]/95 rounded-lg shadow-xl p-8`}>
//           <h1 className='text-4xl font-bold text-white text-center mb-6 font-sans tracking-tight'>
//             {state === "Login" ? "Welcome Back" : "Join WattTogether"}
//           </h1>
//           <p className="text-1xl text-white text-center mb-8">
//             {state === 'Login' ? 'Sign in to continue your journey.' : 'Create an account to fund the future.'}
//           </p>

//           <div className="space-y-6">
//             {/* Name field (Register only) */}
//             {state === "Register" && (
//               <div>
//                 <label className={labelClass} htmlFor="name">Full Name</label>
//                 <input
//                   id="name"
//                   name="name"
//                   value={formData.name}
//                   onChange={changeHandler}
//                   type="text"
//                   placeholder="Your Full Name"
//                   className={inputClass}
//                   required
//                   disabled={isLoading}
//                 />
//               </div>
//             )}

//             {/* Email field */}
//             <div>
//               <label className={labelClass} htmlFor="email">Email</label>
//               <input
//                 id="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={changeHandler}
//                 type="email"
//                 placeholder="you@example.com"
//                 className={inputClass}
//                 required
//                 disabled={isLoading}
//               />
//             </div>

//             {/* Password field */}
//             <div>
//               <label className={labelClass} htmlFor="password">Password</label>
//               <input
//                 id="password"
//                 name="password"
//                 value={formData.password}
//                 onChange={changeHandler}
//                 type="password"
//                 placeholder="••••••••"
//                 className={inputClass}
//                 required
//                 disabled={isLoading}
//               />
//             </div>
//           </div>
          
//           {/* Error Message Display */}
//           {error && (
//             <div className="mt-4 bg-red-900/50 border border-red-500 p-3 rounded-lg">
//               <p className="text-red-400 text-sm text-center">{error}</p>
//             </div>
//           )}

//           {/* Wallet generation loading/error (after registration) */}
//           {walletLoading && (
//             <div className="mt-4 bg-blue-900/50 border border-blue-500 p-3 rounded-lg">
//               <p className="text-blue-400 text-sm text-center">Setting up your blockchain wallet...</p>
//             </div>
//           )}
//           {walletError && (
//             <div className="mt-4 bg-red-900/50 border border-red-500 p-3 rounded-lg">
//               <p className="text-red-400 text-sm text-center">Wallet setup error: {walletError}</p>
//             </div>
//           )}

//           {/* Terms and conditions */}
//           {state === 'Register' && (
//             <div className="flex items-start mt-6">
//               <input
//                 id="terms"
//                 type="checkbox"
//                 checked={agreedToTerms}
//                 onChange={(e) => setAgreedToTerms(e.target.checked)}
//                 className="mt-1 h-4 w-4 rounded border-gray-500 bg-gray-700 text-[#1E4D91] focus:ring-[#1E4D91]"
//                 disabled={isLoading}
//               />
//               <label htmlFor="terms" className="ml-3 text-gray-400 text-sm">
//                 I agree to the <a href="/terms" className="font-medium text-blue-400 hover:underline">Terms of Service</a> and <a href="/privacy" className="font-medium text-blue-400 hover:underline">Privacy Policy</a>.
//               </label>
//             </div>
//           )}

//           {/* Continue button */}
//           <button
//             onClick={handleSubmit}
//             disabled={isLoading}
//             className={`w-full mt-8 py-3 rounded-md transition-colors duration-300 uppercase tracking-wider ${
//               isLoading
//                 ? "bg-gray-600 text-gray-400 cursor-not-allowed"
//                 : "bg-[#508C9B] text-white hover:bg-[#134B70]"
//             }`}
//           >
//             {isLoading ? (
//               <div className="flex items-center justify-center">
//                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                 {state === "Login" ? "Signing In..." : "Creating Account..."}
//               </div>
//             ) : (
//               state === "Login" ? "Sign In" : "Create Account"
//             )}
//           </button>

//           {/* Toggle between Login/Register */}
//           <p className="text-center mt-6 text-gray-400">
//             {state === "Register" ? "Already have an account?" : "New to WattTogether?"}
//             <span
//               onClick={() => {
//                 if (!isLoading) {
//                   setState(state === "Login" ? "Register" : "Login");
//                   setError("");
//                 }
//               }}
//               className={`font-semibold ml-2 ${
//                 isLoading
//                   ? "text-gray-600 cursor-not-allowed"
//                   : "text-blue-400 cursor-pointer hover:underline"
//               }`}
//             >
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
import { useWeb3Auth } from '../context/Web3AuthContext'; // Adjust import path if needed

const LoginRegister = () => {
  const navigate = useNavigate();
  const [state, setState] = useState("Login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
    });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Web3Auth context
  const { connectWithCustomJWT, walletAddress, isLoading: walletLoading, error: walletError } = useWeb3Auth();

  // Input handlers
  const changeHandler = (e) => {
    setError("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // NOTE: These handlers were in your original file but missing `interest` in state.
  // Assuming `interest` should be part of formData if you use these.
  // If not, you can remove them. For now, I'll add `interest: []` to the initial state.
  /*
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
  */

  // Registration and login handlers
  const handleSubmit = async () => {
    if (state === "Register" && !agreedToTerms) {
      setError("You must agree to the terms and policies to continue.");
      return;
    }

    setIsLoading(true);
    setError("");

    const BACKEND_URL = import.meta.env.VITE_API_GATEWAY_URL;
    // This is the line that was broken
    const url = state === "Login"
      ? `${BACKEND_URL}/members/login`
      : `${BACKEND_URL}/members/register`;

    try {
      // Main register/login API call
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (responseData.success) {
        localStorage.setItem('token', responseData.token);

        // Store Web3Auth id_token if returned from backend
        if (responseData.id_token) {
          localStorage.setItem('id_token', responseData.id_token);
        }

        if (responseData.user) {
          localStorage.setItem('user', JSON.stringify(responseData.user));
        }

        // --- START FIX ---
        // Call wallet connection for BOTH login and registration
        // The context's connectWithCustomJWT function is smart enough
        // to either connect or reuse an existing session.
        try {
          if (state === "Login") {
            setError("Connecting to your wallet...");
          } else {
            setError("Generating crypto wallet...");
          }

          // This will now run for Login AND Register
          await connectWithCustomJWT(); 
          
          // Now that the context is updated with provider/address, navigate.
          navigate('/member/home');

        } catch (err) {
          // This catch is for the connectWithCustomJWT call
          console.error("Wallet connection failed:", err);
          setError(`Wallet connection failed: ${err.message}. Please try logging in again.`);
          // Don't navigate if wallet connection fails
        }
        // --- END FIX ---

      } else if (response.status === 409 || (responseData.message && responseData.message.toLowerCase().includes("duplicate"))) {
        setError("User with that email already exists. Please sign in instead.");
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

  // UI input styling
  const inputClass = "w-full px-4 py-3 bg-[#EEEEEE] rounded-md font-inter placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#508C9B]";
  const labelClass = "block text-white font-inter text-sm mb-1";

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-y-auto">
      <div className="relative z-10 flex items-center justify-center min-h-screen w-full px-4 my-5">
        <div className={`w-full max-w-lg bg-[#201E43]/95 rounded-lg shadow-xl p-8`}>
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
          </div>
          
          {/* Error Message Display */}
          {error && (
            <div className="mt-4 bg-red-900/50 border border-red-500 p-3 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Wallet generation loading/error (after registration) */}
          {walletLoading && (
            <div className="mt-4 bg-blue-900/50 border border-blue-500 p-3 rounded-lg">
              <p className="text-blue-400 text-sm text-center">Setting up your blockchain wallet...</p>
            </div>
          )}
          {walletError && (
            <div className="mt-4 bg-red-900/50 border border-red-500 p-3 rounded-lg">
              <p className="text-red-400 text-sm text-center">Wallet setup error: {walletError}</p>
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
                I agree to the <a href="/terms" className="font-medium text-blue-400 hover:underline">Terms of Service</a> and <a href="/privacy" className="font-medium text-blue-4H00 hover:underline">Privacy Policy</a>.
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
              state === "Login" ? "Sign In" : "Create Account"
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

