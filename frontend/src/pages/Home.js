import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Brain, 
  MessageCircle, 
  CloudSun, 
  Shield, 
  Users, 
  TrendingUp,
  Leaf,
  Camera,
  Smartphone,
  Globe,
  Award,
  ArrowRight,
  CheckCircle,
  Star,
  Play
} from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI Disease Detection',
      description: 'Upload crop images and get instant AI-powered disease diagnosis with 95% accuracy using Google Gemini.',
      color: 'from-blue-500 to-purple-600'
    },
    {
      icon: MessageCircle,
      title: 'Expert Consultations',
      description: 'Connect with certified agricultural experts for personalized advice and treatment recommendations.',
      color: 'from-green-500 to-teal-600'
    },
    {
      icon: CloudSun,
      title: 'Weather Integration',
      description: 'Get real-time weather data and environmental risk analysis for proactive crop management.',
      color: 'from-yellow-500 to-orange-600'
    },
    {
      icon: Shield,
      title: 'Preventive Care',
      description: 'Receive alerts and recommendations to prevent diseases before they affect your crops.',
      color: 'from-red-500 to-pink-600'
    }
  ];

  const benefits = [
    { icon: TrendingUp, text: 'Increase crop yield by up to 30%' },
    { icon: Users, text: 'Connect with 500+ agricultural experts' },
    { icon: Globe, text: 'Available in 10+ regional languages' },
    { icon: Smartphone, text: 'Works on any device, anywhere' },
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Farmer, Punjab',
      content: 'CropCare helped me identify wheat rust early and save my entire harvest. The AI diagnosis was spot-on!',
      rating: 5,
      avatar: 'RK'
    },
    {
      name: 'Dr. Priya Sharma',
      role: 'Agricultural Expert',
      content: 'As an expert on the platform, I can reach and help more farmers than ever before. The consultation system is excellent.',
      rating: 5,
      avatar: 'PS'
    },
    {
      name: 'Mohammed Ali',
      role: 'Farmer, Maharashtra',
      content: 'The weather alerts saved my tomato crop from fungal infection. This app is a game-changer for small farmers.',
      rating: 5,
      avatar: 'MA'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Farmers Helped' },
    { number: '95%', label: 'Accuracy Rate' },
    { number: '500+', label: 'Expert Network' },
    { number: '24/7', label: 'Support Available' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="absolute inset-0 bg-mesh opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                <span className="text-gradient">AI-Powered</span><br />
                Crop Disease<br />
                Management
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                Protect your crops with cutting-edge AI technology. Get instant disease diagnosis, 
                expert consultations, and weather-based risk alerts to maximize your harvest.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/register"
                  className="btn-primary text-lg px-8 py-3 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  Try it Now!
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <button className="btn-secondary text-lg px-8 py-3 group">
                  <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </button>
              </div>
              <div className="flex items-center justify-center lg:justify-start mt-8 text-sm text-gray-500">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                We are here for our Farmers
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="aspect-square bg-gradient-to-br from-green-100 to-blue-100 rounded-xl mb-6 flex items-center justify-center">
                  <Camera className="h-24 w-24 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Disease Detection in Action</h3>
                <p className="text-gray-600 mb-4">Upload a photo and get instant AI analysis</p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                    95% accuracy rate
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
                    Instant results in 3 seconds
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="h-2 w-2 bg-purple-500 rounded-full mr-2"></div>
                    Treatment recommendations included
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Powerful Features for Modern Farming
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Everything you need to protect and optimize your crops, powered by cutting-edge AI technology.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card-hover p-8 group cursor-pointer"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Why Choose CropCare?
              </h2>
              <p className="text-green-100 text-lg mb-8">
                Join thousands of farmers who have transformed their agricultural practices with our AI-powered platform.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center text-white"
                    >
                      <Icon className="h-5 w-5 text-green-200 mr-3 flex-shrink-0" />
                      <span className="text-lg">{benefit.text}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Leaf className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-white font-semibold">Crop Health</h4>
                    <p className="text-green-100 text-sm mt-1">Monitor 24/7</p>
                  </div>
                  <div className="text-center">
                    <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Brain className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-white font-semibold">AI Analysis</h4>
                    <p className="text-green-100 text-sm mt-1">Instant Results</p>
                  </div>
                  <div className="text-center">
                    <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-white font-semibold">Expert Network</h4>
                    <p className="text-green-100 text-sm mt-1">Professional Advice</p>
                  </div>
                  <div className="text-center">
                    <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-white font-semibold">Proven Results</h4>
                    <p className="text-green-100 text-sm mt-1">95% Success Rate</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              What Our Users Say
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600"
            >
              Real stories from farmers and experts who trust CropCare.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-6"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Farming?
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Join thousands of farmers who are already using AI to protect their crops and increase their yields.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
               Try it Now
                <ArrowRight className="ml-2 h-5 w-5 inline" />
              </Link>
              <Link
                to="/login"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-green-600 transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
            <p className="text-green-200 text-sm mt-4">
              For Our Farmer Friends...
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;