import { useState } from 'react';
import PropTypes from 'prop-types';

const DonationModal = ({ campaign, onClose }) => {
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleDevFaucet = async (e) => {
        e.preventDefault();
        if (!amount || isNaN(amount) || amount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }

        setIsProcessing(true);
        setError('');
        setSuccessMessage('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/campaigns/dev-fund', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    campaignId: campaign._id,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Record this investment locally so MyInvestments can display it
                try {
                    const key = 'my_investments';
                    const arr = JSON.parse(localStorage.getItem(key) || '[]');
                    if (Array.isArray(arr)) {
                        if (!arr.includes(campaign._id)) {
                            arr.push(campaign._id);
                            localStorage.setItem(key, JSON.stringify(arr));
                        }
                    } else {
                        localStorage.setItem(key, JSON.stringify([campaign._id]));
                    }
                } catch {}

                setSuccessMessage(data.message);
                setTimeout(() => {
                    onClose(true); // Close the modal and indicate success
                }, 2000);
            } else {
                setError(data.message || 'Developer faucet failed.');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred. Please check the console.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl w-11/12 max-w-md">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Fund "{campaign.title}"</h2>
                <p className="mb-6 text-gray-600">Enter the amount you'd like to contribute.</p>

                <form onSubmit={handleDevFaucet}>
                    <div className="mb-4">
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount (INR)</label>
                        <input
                            type="number"
                            id="amount"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., 500"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={isProcessing}
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    {successMessage && <p className="text-green-500 text-sm mb-4">{successMessage}</p>}

                    <div className="flex flex-col gap-3 mt-6">
                        <button
                            type="submit"
                            className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Processing...' : 'Fund with Test USDC (Dev Faucet)'}
                        </button>
                         <button
                            type="button"
                            onClick={() => onClose(false)}
                            className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:bg-gray-400"
                            disabled={isProcessing}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

DonationModal.propTypes = {
    campaign: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default DonationModal;

