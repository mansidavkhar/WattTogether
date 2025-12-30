const MainFeatures = () => {
  const features = [
    {
      title: "Blockchain Security",
      description: "Every transaction is secured on the Polygon blockchain, ensuring transparency and immutability."
    },
    {
      title: "Zero Gas Fees",
      description: "Our backend relayer handles all blockchain transactions - you never pay gas fees."
    },
    {
      title: "Milestone Governance",
      description: "Donors vote on fund releases through our DAO-style voting system. Your voice matters."
    },
    {
      title: "Fiat-Friendly",
      description: "Donate in INR - we handle the crypto conversion seamlessly in the background."
    }
  ];

  return (
    <div className="w-full bg-white py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-black font-[inter] text-3xl text-center py-12 underline underline-offset-8">
            Why Choose WattTogether?
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            A platform that combines the ease of traditional funding with the transparency of blockchain technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-[#508C9B]"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainFeatures;
