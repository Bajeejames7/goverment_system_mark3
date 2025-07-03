import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Shield, Users, Archive, Search, Clock, ArrowRight, CheckCircle } from "lucide-react";
import logoPath from "@assets/Republic_of_kenya_logo.jpeg";
import { useTheme } from "@/contexts/ThemeContext";

export default function Welcome() {
  const [, navigate] = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const features = [
    {
      icon: FileText,
      title: "Document Management",
      description: "Secure digital filing system for all government correspondence and official documents"
    },
    {
      icon: Shield,
      title: "Role-Based Security",
      description: "Multi-level access control ensuring document confidentiality and proper authorization"
    },
    {
      icon: Users,
      title: "Workflow Automation",
      description: "Streamlined routing from Registry through Principal Secretary to Department Officers"
    },
    {
      icon: Archive,
      title: "Digital Archive",
      description: "Comprehensive records retention with automated archiving and retrieval systems"
    },
    {
      icon: Search,
      title: "Advanced Search",
      description: "Powerful search capabilities to locate documents quickly using multiple criteria"
    },
    {
      icon: Clock,
      title: "Real-time Tracking",
      description: "Monitor document status and processing times with complete audit trails"
    }
  ];

  const benefits = [
    "Eliminates paper-based inefficiencies",
    "Ensures government compliance standards",
    "Reduces processing time by 70%",
    "Provides complete audit transparency",
    "Secure cloud-based accessibility",
    "24/7 system availability"
  ];

  const workflow_steps = [
    { step: 1, title: "Document Submission", desc: "Registry receives and categorizes incoming documents" },
    { step: 2, title: "PS Review", desc: "Principal Secretary reviews and approves routing decisions" },
    { step: 3, title: "Department Processing", desc: "Relevant departments handle document processing" },
    { step: 4, title: "Response & Archive", desc: "Completed documents are responded to and archived" }
  ];

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/') {
        navigate('/login');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Prevent navigation to /login or / from Welcome if already authenticated (any token)
  useEffect(() => {
    const hasToken = () =>
      localStorage.getItem('authToken') ||
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token');
    if (hasToken()) {
      window.location.replace('/dashboard');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`fixed top-4 right-4 p-3 rounded-full 
          ${isDark ? 'bg-white hover:bg-slate-100' : 'bg-slate-900 hover:bg-slate-800'}
          shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 z-50`}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5" fill="#facc15" />
            <g stroke="#facc15">
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </g>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="#fff" stroke="#fff" />
          </svg>
        )}
      </button>
      {/* Header */}
      <header className="relative z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <img 
                src={logoPath} 
                alt="Republic of Kenya Logo" 
                className="h-12 w-12 rounded-full shadow-lg ring-2 ring-blue-500/20"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Records Management Unit
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  State Department of Industry
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
            >
              Access System
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-900/20 dark:to-indigo-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium">
              Government Digital Transformation Initiative
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Modern Digital
              <span className="block text-blue-600 dark:text-blue-400">Records Management</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transforming government operations through secure, efficient, and transparent 
              document management for the State Department of Industry.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate("/login")}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Login to System
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Comprehensive Digital Solutions
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Built specifically for government operations with enterprise-grade security and compliance.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors duration-300">
                    <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Streamlined Government Workflow
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              From document receipt to final archiving, our system ensures efficient processing at every step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflow_steps.map((item, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4 shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                {index < workflow_steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gray-300 dark:bg-gray-600 -translate-x-8"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Why Choose Our RMU System?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Designed by government technology experts, our system addresses the unique challenges 
                of public sector document management while ensuring complete transparency and accountability.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 shadow-2xl">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 text-white rounded-full mb-6 shadow-lg">
                    <Shield className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Secure & Compliant
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Built with government-grade security standards and full compliance 
                    with Kenya's digital governance requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join the digital transformation of government operations. 
            Access your secure dashboard and start managing documents efficiently.
          </p>
          <Button 
            onClick={() => navigate("/login")}
            size="lg"
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Access RMU System
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <img 
                src={logoPath} 
                alt="Republic of Kenya Logo" 
                className="h-10 w-10 rounded-full"
              />
              <div>
                <p className="text-white font-semibold">Records Management Unit</p>
                <p className="text-gray-400 text-sm">State Department of Industry</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm">
                © 2025 Government of Kenya. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Secure Digital Government Solutions
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}