import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface ExpandableCardProps {
  children: React.ReactNode;
  expandedContent: React.ReactNode;
  className?: string;
  onJoin?: () => void;
  joinText?: string;
}

const ExpandableCard: React.FC<ExpandableCardProps> = ({
  children,
  expandedContent,
  className = '',
  onJoin,
  joinText = 'Join'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => setShowModal(true), 50);
  };

  const handleClose = () => {
    setShowModal(false);
    setTimeout(() => setIsExpanded(false), 300);
  };

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isExpanded]);

  return (
    <>
      <div
        onClick={handleExpand}
        className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${className}`}
      >
        {children}
      </div>

      {isExpanded && (
        <div 
          className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
            showModal ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleClose}
        >
          <div 
            className={`bg-gray-900/95 backdrop-blur-md rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700/50 transform transition-all duration-300 ease-out ${
              showModal ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-100">Details</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {expandedContent}
                
                {onJoin && (
                  <div className="pt-6 border-t border-gray-700">
                    <button
                      onClick={onJoin}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={20} />
                      {joinText}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpandableCard;