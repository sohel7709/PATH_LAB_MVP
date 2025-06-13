import React from 'react';

const PricingPage = () => {
  const pricingPlans = [
    {
      name: 'Basic Plan',
      price: '$10/month',
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      buttonText: 'Choose Plan',
    },
    {
      name: 'Pro Plan',
      price: '$20/month',
      features: ['Feature A', 'Feature B', 'Feature C', 'Feature D'],
      buttonText: 'Choose Plan',
    },
    {
      name: 'Enterprise Plan',
      price: 'Contact Us',
      features: ['Custom Feature X', 'Custom Feature Y', 'Dedicated Support'],
      buttonText: 'Contact Us',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-12">Our Pricing Plans</h1>
      <div className="grid md:grid-cols-3 gap-8">
        {pricingPlans.map((plan, index) => (
          <div key={index} className="border p-6 rounded-lg shadow-lg flex flex-col">
            <h2 className="text-2xl font-semibold mb-4">{plan.name}</h2>
            <p className="text-xl font-bold mb-4">{plan.price}</p>
            <ul className="mb-6 space-y-2 flex-grow">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-auto">
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>
      <p className="text-center mt-12 text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
    </div>
  );
};

export default PricingPage;
