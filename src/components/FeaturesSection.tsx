import React from 'react';
import { Shield, Lock, Zap, Users, CheckCircle, Eye } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Shield,
      title: 'Privacy-First Verification',
      description: 'Zero-knowledge proofs ensure your personal data stays private while proving your age credentials.',
      color: 'text-purple-400'
    },
    {
      icon: Lock,
      title: 'Secure Age Gating',
      description: 'Access 18+ content and services with cryptographic proof of age without revealing your identity.',
      color: 'text-blue-400'
    },
    {
      icon: Zap,
      title: 'Instant Verification',
      description: 'Quick and seamless verification process that takes seconds, not hours or days.',
      color: 'text-yellow-400'
    },
    {
      icon: Users,
      title: 'Decentralized',
      description: 'No central authority controls your credentials. You own and control your verification status.',
      color: 'text-green-400'
    },
    {
      icon: CheckCircle,
      title: 'Compliant',
      description: 'Meets regulatory requirements while maintaining user privacy and data protection standards.',
      color: 'text-indigo-400'
    },
    {
      icon: Eye,
      title: 'Transparent',
      description: 'Open-source verification process that can be audited and verified by anyone.',
      color: 'text-pink-400'
    }
  ];

  return (
    <section id="features" className="mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">
          Why Choose Gate Protocol?
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Experience the future of privacy-preserving age verification with cutting-edge technology
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <div
              key={index}
              className="bg-gray-900/70 backdrop-blur-md rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-lg bg-gray-800/50 ${feature.color}`}>
                  <IconComponent size={24} />
                </div>
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">{feature.description}</p>
            </div>
          );
        })}
      </div>

      {/* Additional Info Section */}
      <div className="mt-16 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl p-8 border border-purple-500/20">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Built on Polygon ID
          </h3>
          <p className="text-gray-300 mb-6 max-w-3xl mx-auto">
            Gate Protocol leverages Polygon ID's self-sovereign identity infrastructure to provide 
            verifiable credentials that respect user privacy while enabling compliant age verification 
            for Web3 applications.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
              <span className="text-gray-300 text-sm">Zero-Knowledge Proofs</span>
            </div>
            <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
              <span className="text-gray-300 text-sm">Self-Sovereign Identity</span>
            </div>
            <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
              <span className="text-gray-300 text-sm">Verifiable Credentials</span>
            </div>
            <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
              <span className="text-gray-300 text-sm">Privacy by Design</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
