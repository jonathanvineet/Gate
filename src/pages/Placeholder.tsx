import React from 'react';
import { CheckCircle, ArrowLeft } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  message: string;
  onBack: () => void;
}

const Placeholder: React.FC<PlaceholderProps> = ({ title, message, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-700/50 text-center">
        <div className="bg-green-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-green-400" size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-100 mb-4">{title}</h1>
        <p className="text-gray-300 mb-6">{message}</p>
        
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 mx-auto"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Placeholder;