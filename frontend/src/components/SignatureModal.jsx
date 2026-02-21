import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * SignatureModal - Reusable modal for requesting user signatures
 * Shows a professional UI while waiting for user to sign with Privy
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {string} title - Modal title (e.g., "Sign Donation", "Sign Veto")
 * @param {string} message - Description of what they're signing
 * @param {object} signatureData - Data to display (amount, action, etc.)
 * @param {string} status - 'awaiting', 'signing', 'success', 'error'
 * @param {string} errorMessage - Error message if status is 'error'
 * @param {function} onClose - Callback to close modal
 */
const SignatureModal = ({ 
  isOpen, 
  title = "Sign Transaction",
  message = "Please sign this transaction in your wallet",
  signatureData = {},
  status = 'awaiting', // 'awaiting', 'signing', 'success', 'error'
  errorMessage = '',
  onClose 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Auto-hide on success after 2 seconds
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        onClose?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-slideUp">
        {/* Header */}
        <div className={`px-6 py-4 ${
          status === 'error' ? 'bg-red-600' :
          status === 'success' ? 'bg-green-600' :
          'bg-gradient-to-r from-[#134B70] to-[#508C9B]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Icon based on status */}
              {status === 'awaiting' && (
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              )}
              {status === 'signing' && (
                <svg className="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {status === 'success' && (
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {status === 'error' && (
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <h2 className="text-xl font-bold text-white">{title}</h2>
            </div>
            {status !== 'signing' && (
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status Message */}
          <div className="text-center">
            {status === 'awaiting' && (
              <div className="space-y-2">
                <p className="text-gray-700 text-lg font-semibold">{message}</p>
                <p className="text-gray-500 text-sm">A signature popup will appear shortly</p>
              </div>
            )}
            {status === 'signing' && (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="w-16 h-16 border-4 border-[#508C9B] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-700 text-lg font-semibold">Waiting for signature...</p>
                <p className="text-gray-500 text-sm">Please check your wallet popup</p>
              </div>
            )}
            {status === 'success' && (
              <div className="space-y-2">
                <div className="flex justify-center mb-3">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-700 text-lg font-bold">✅ Signed Successfully!</p>
                <p className="text-gray-500 text-sm">Transaction is being processed...</p>
              </div>
            )}
            {status === 'error' && (
              <div className="space-y-2">
                <div className="flex justify-center mb-3">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-700 text-lg font-bold">Signature Failed</p>
                <p className="text-red-600 text-sm">{errorMessage || 'User rejected signature'}</p>
              </div>
            )}
          </div>

          {/* Transaction Details */}
          {Object.keys(signatureData).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between text-gray-700 hover:text-gray-900 transition-colors"
              >
                <span className="font-semibold text-sm">Transaction Details</span>
                <svg
                  className={`w-5 h-5 transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDetails && (
                <div className="mt-3 pt-3 border-t border-gray-300 space-y-2">
                  {Object.entries(signatureData).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="font-mono text-gray-900 text-right max-w-[60%] truncate" title={value}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Info Box */}
          {status === 'awaiting' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Why do I need to sign?</p>
                  <p className="text-blue-700">
                    Your signature authorizes this action on the blockchain. 
                    <strong className="font-semibold"> You won't pay any gas fees</strong> - our relayer sponsors the transaction for you.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {status === 'error' && (
            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Footer Note */}
        {status === 'signing' && (
          <div className="px-6 pb-4 text-center">
            <p className="text-xs text-gray-500">
              Don't see the popup? Check your browser's popup blocker
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

SignatureModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  signatureData: PropTypes.object,
  status: PropTypes.oneOf(['awaiting', 'signing', 'success', 'error']),
  errorMessage: PropTypes.string,
  onClose: PropTypes.func
};

export default SignatureModal;
