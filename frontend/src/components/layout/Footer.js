import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Facebook, Twitter, Instagram, Github, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-800">CropCare</h1>
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed">
              AI-driven crop disease prediction and management system.  
              Helping farmers stay ahead with prevention and treatment solutions.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-gray-800 font-semibold mb-3">Quick Links</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/predict"
                  className="text-gray-600 hover:text-green-600 transition-colors"
                >
                  Disease Prediction
                </Link>
              </li>
              <li>
                <Link
                  to="/consultations"
                  className="text-gray-600 hover:text-green-600 transition-colors"
                >
                  Consultations
                </Link>
              </li>
              <li>
                <Link
                  to="/weather"
                  className="text-gray-600 hover:text-green-600 transition-colors"
                >
                  Weather Insights
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-600 hover:text-green-600 transition-colors"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Section */}
          <div>
            <h2 className="text-gray-800 font-semibold mb-3">Stay Connected</h2>
            <p className="text-gray-600 text-sm mb-3">
              Follow us on social media or reach out for support.
            </p>
            <div className="flex space-x-4">
              {[
                { Icon: Facebook, link: "#" },
                { Icon: Twitter, link: "#" },
                { Icon: Instagram, link: "#" },
                { Icon: Github, link: "#" },
                { Icon: Mail, link: "mailto:support@cropcare.com" },
              ].map(({ Icon, link }, idx) => (
                <motion.a
                  key={idx}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2 }}
                  className="p-2 bg-gray-100 rounded-full hover:bg-green-100 transition-colors"
                >
                  <Icon className="h-5 w-5 text-gray-600 hover:text-green-600" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-gray-200 pt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} CropCare. All rights reserved.</p>
          <div className="flex space-x-6 mt-3 sm:mt-0">
            <Link to="/privacy" className="hover:text-green-600 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-green-600 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
