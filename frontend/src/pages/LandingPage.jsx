import React from 'react';
import { Link } from 'react-router-dom';

// Placeholder icons - replace with actual icons or a library like Heroicons
const PlaceholderIcon = ({ className = "w-12 h-12 mb-4 text-blue-500" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
    <path d="M5 13l4 4L19 7"></path>
  </svg>
);


const LandingPage = () => {
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    console.log('Contact Form submitted:', data);
    alert('Message sent (simulated)! Check the browser console for the data submitted.');
    event.target.reset(); // Optionally reset the form
  };

  const keyFeatures = [
    { name: 'Smart Report Creation', description: 'Enter test results with AI-based suggestions & reference validation', icon: <PlaceholderIcon /> },
    { name: 'Chatbot Entry Flow', description: 'Patients can be added via WhatsApp-style chatbot interface', icon: <PlaceholderIcon /> },
    { name: 'WhatsApp Report Delivery', description: 'Directly send PDF reports to patients or doctors from the dashboard', icon: <PlaceholderIcon /> },
    { name: 'Print-Ready Layout', description: 'Support for pre-printed letterheads with clean A4 layout', icon: <PlaceholderIcon /> },
    { name: 'Revenue Dashboard', description: 'Track earnings daily, weekly, monthly, and filter by date range', icon: <PlaceholderIcon /> },
    { name: 'Role-Based Access', description: 'Admin & Technician users with access control per lab', icon: <PlaceholderIcon /> },
    { name: 'Multi-Lab (Tenant-based) Setup', description: 'Each lab gets isolated data & login – perfect for SaaS', icon: <PlaceholderIcon /> },
    { name: 'Report Templates', description: 'Use system templates or create your own from JSON', icon: <PlaceholderIcon /> },
    { name: 'AI-Powered Summaries', description: 'GPT-generated patient summaries from test values', icon: <PlaceholderIcon /> },
  ];

  const whyChooseUsBenefits = [
    { benefit: 'Speed & Automation', details: 'Saves 2–3 hours daily with auto-fill & chatbot', icon: <CheckIcon /> },
    { benefit: 'Secure & Isolated', details: 'Each lab’s data is secure in separate environment (multi-tenant architecture)', icon: <CheckIcon /> },
    { benefit: 'Technician Friendly', details: 'No technical skill required — mobile responsive UI', icon: <CheckIcon /> },
    { benefit: 'Legally Compliant Reports', details: 'Neatly formatted reports ready for doctors, hospitals', icon: <CheckIcon /> },
    { benefit: 'Insights for Admins', details: 'Income, pending reports, test trends, etc.', icon: <CheckIcon /> },
    { benefit: 'Supports All Major Tests', details: 'CBC, CRP, LFT, KFT, Urine, Widal, ANC, Pre-Op, etc.', icon: <CheckIcon /> },
  ];

  const pricingPlans = [
    { name: 'Basic', features: '1 Lab, 1 Admin, 1 Technician, WhatsApp, PDF', price: '₹499/month', cta: 'Choose Basic' },
    { name: 'Premium', features: '3 Users, Advanced Analytics, Custom Templates', price: '₹999/month', cta: 'Choose Premium' },
    { name: 'Enterprise', features: 'Unlimited Labs & Users, Priority Support, Super Admin', price: 'Contact Us', cta: 'Contact Sales' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* 1. Hero Section */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-3xl font-bold">LabNexus</Link>
          <div>
            <Link to="/login" className="bg-white text-blue-600 font-bold py-2 px-4 rounded-md hover:bg-blue-100 transition duration-300">
              Login
            </Link>
            {/* <Link to="/contact" className="hover:text-blue-200 px-3 py-2 ml-2">Contact</Link> */}
          </div>
        </nav>
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4">AI-Powered Pathology Lab Management Software</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">Automate reports, manage labs, send WhatsApp reports — all in one platform.</p>
          <div className="space-x-4">
            <Link to="/contact" className="bg-yellow-400 hover:bg-yellow-500 text-blue-800 font-bold py-3 px-8 rounded-md text-lg transition duration-300">
              Book a Free Demo
            </Link>
            <a href="/sample-report.pdf" target="_blank" rel="noopener noreferrer" className="bg-transparent border-2 border-white hover:bg-white hover:text-blue-700 text-white font-bold py-3 px-8 rounded-md text-lg transition duration-300">
              See Sample Report
            </a>
          </div>
          {/* Visual: Placeholder for illustration/dashboard image */}
          <div className="mt-12">
            <img src="https://via.placeholder.com/600x300.png?text=Dashboard+Illustration" alt="LabNexus Dashboard Illustration" className="mx-auto rounded-lg shadow-xl" />
          </div>
        </div>
      </header>

      {/* 2. Problem-Solution Statement */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Stop Drowning in Manual Work</h2>
          <p className="text-lg text-gray-600 mb-4 max-w-2xl mx-auto">Still printing reports manually? Tired of Excel chaos and WhatsApp confusion?</p>
          <p className="text-xl font-semibold text-blue-600 max-w-3xl mx-auto">Our software automates patient entry, test reporting, and delivery — saving time and boosting accuracy.</p>
        </div>
      </section>

      {/* 3. Key Features Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features, Technician-Friendly</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {keyFeatures.map((feature) => (
              <div key={feature.name} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center">
                {feature.icon}
                <h3 className="text-xl font-semibold mb-2">{feature.name}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">Simple 3-Step Workflow</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Enter Patient Info</h3>
              <p className="text-gray-600">Via Chatbot or Form</p>
              <img src="https://via.placeholder.com/300x200.png?text=Step+1+Visual" alt="Step 1" className="mt-4 rounded shadow"/>
            </div>
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">Add Tests & Results</h3>
              <p className="text-gray-600">Auto Flagging Active</p>
              <img src="https://via.placeholder.com/300x200.png?text=Step+2+Visual" alt="Step 2" className="mt-4 rounded shadow"/>
            </div>
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">Preview & Send</h3>
              <p className="text-gray-600">PDF, Download, or WhatsApp</p>
              <img src="https://via.placeholder.com/300x200.png?text=Step+3+Visual" alt="Step 3" className="mt-4 rounded shadow"/>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Why Choose Us (Benefits Section) */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why LabNexus is Your Best Choice</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyChooseUsBenefits.map(item => (
              <div key={item.benefit} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-start mb-3">
                  {item.icon}
                  <h3 className="text-xl font-semibold">{item.benefit}</h3>
                </div>
                <p className="text-gray-600">{item.details}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Pricing Plans Section */}
      <section id="pricing" className="py-16 bg-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Flexible Pricing for Every Lab</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className="bg-white p-8 rounded-lg shadow-xl flex flex-col text-center hover:scale-105 transition-transform duration-300">
                <h3 className="text-2xl font-semibold mb-4">{plan.name}</h3>
                <p className="text-3xl font-bold mb-2">{plan.price}</p>
                {plan.name !== 'Enterprise' && <p className="text-gray-500 mb-6">per month</p>}
                {plan.name === 'Basic' && <span className="bg-yellow-200 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-4 self-center">7-Day Free Trial</span>}
                <ul className="text-gray-600 mb-8 space-y-2 flex-grow">
                  {plan.features.split(', ').map(feature => <li key={feature} className="flex items-center justify-center"><CheckIcon /> {feature}</li>)}
                </ul>
                <Link to={plan.name === 'Enterprise' ? '/contact' : '/login'} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md mt-auto transition duration-300">
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Testimonials / Social Proof */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-8">Trusted by Labs Like Yours</h2>
          <div className="bg-gray-100 p-8 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            <img src="https://via.placeholder.com/80x80.png?text=Dr.+Shaikh" alt="Dr. Shaikh" className="w-20 h-20 rounded-full mx-auto mb-4"/>
            <p className="text-lg text-gray-700 italic mb-4">“This software helped us reduce report generation time by 70%. The WhatsApp delivery is a game-changer!”</p>
            <p className="font-semibold">— Dr. Shaikh, Sunrise Diagnostics</p>
          </div>
        </div>
      </section>

      {/* 9. Call to Action (Repeated) */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Join 200+ Labs Already Using LabNexus!</h2>
          <div className="space-x-0 md:space-x-4 space-y-4 md:space-y-0">
            <Link to="/contact" className="bg-yellow-400 hover:bg-yellow-500 text-blue-800 font-bold py-3 px-8 rounded-md text-lg transition duration-300 inline-block">
              Start Free Trial
            </Link>
            <Link to="/contact" className="bg-white hover:bg-gray-200 text-blue-700 font-bold py-3 px-8 rounded-md text-lg transition duration-300 inline-block">
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Contact Section */}
      <section id="contact" className="py-16 bg-gray-100">
        <div className="container mx-auto px-6 md:flex md:justify-between">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
            <p className="text-gray-700 mb-2"><strong>BUILDSOFT IT SOLUTIONS PVT LTD</strong></p>
            <p className="text-gray-700 mb-2">Nagpur, Maharashtra, India</p>
            <p className="text-gray-700 mb-2">Phone/WhatsApp: <a href="tel:+91XXXXXXXXXX" className="text-blue-600 hover:underline">+91 XXXXX XXXXX</a></p>
            <p className="text-gray-700 mb-6">Email: <a href="mailto:info@labnexus.com" className="text-blue-600 hover:underline">info@labnexus.com</a></p>
          </div>
          <div className="md:w-1/2">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-6">Send us a message</h3>
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Name</label>
                <input type="text" id="name" name="name" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email</label>
                <input type="email" id="email" name="email" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div className="mb-6">
                <label htmlFor="message" className="block text-gray-700 font-medium mb-2">Message</label>
                <textarea id="message" name="message" rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required></textarea>
              </div>
              <button type="submit" className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition duration-300">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 11. Footer */}
      <footer className="bg-gray-800 text-white py-10">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-4">
            <Link to="/about" className="hover:text-blue-300 px-3 py-2">About Us</Link>
            <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 px-3 py-2">Privacy Policy</a>
            <a href="/refund-policy.html" target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 px-3 py-2">Refund Policy</a>
            <a href="/terms-conditions.html" target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 px-3 py-2">Terms and Conditions</a>
            <Link to="/careers" className="hover:text-blue-300 px-3 py-2">Careers</Link>
            <Link to="/blog" className="hover:text-blue-300 px-3 py-2">Blog</Link>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} BUILDSOFT IT SOLUTIONS PVT LTD. All rights reserved.</p>
        </div>
      </footer>

      {/* Optional Additions: Floating WhatsApp Button (Example) */}
      {/* <a href="https://wa.me/91XXXXXXXXXX" target="_blank" rel="noopener noreferrer" className="fixed bottom-5 right-5 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition duration-300 z-50">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.289.173-1.413z" />
        </svg>
      </a> */}
    </div>
  );
};

export default LandingPage;
