
import React from 'react';

const LoadingToy: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-20 h-20">
        {/* Assembling Blocks */}
        <div className="block-1 absolute w-8 h-8 bg-red-400 rounded-md"></div>
        <div className="block-2 absolute w-8 h-8 bg-blue-400 rounded-md"></div>
        <div className="block-3 absolute w-8 h-8 bg-primary rounded-md"></div>
        <div className="block-4 absolute w-8 h-8 bg-green-400 rounded-md"></div>
        
        {/* Style for animations */}
        <style>{`
          @keyframes assemble-1 {
            0%, 20% { transform: translate(-20px, 40px) scale(0.8); opacity: 0; }
            100% { transform: translate(10px, 10px) scale(1); opacity: 1; }
          }
          @keyframes assemble-2 {
            0%, 20% { transform: translate(50px, 40px) scale(0.8); opacity: 0; }
            100% { transform: translate(34px, 10px) scale(1); opacity: 1; }
          }
          @keyframes assemble-3 {
            0%, 20% { transform: translate(-20px, -20px) scale(0.8); opacity: 0; }
            100% { transform: translate(10px, 34px) scale(1); opacity: 1; }
          }
          @keyframes assemble-4 {
            0%, 20% { transform: translate(50px, -20px) scale(0.8); opacity: 0; }
            100% { transform: translate(34px, 34px) scale(1); opacity: 1; }
          }
          .block-1 { animation: assemble-1 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite; }
          .block-2 { animation: assemble-2 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite; }
          .block-3 { animation: assemble-3 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite; }
          .block-4 { animation: assemble-4 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite; }
        `}</style>
      </div>
      <p className="mt-8 text-[#8a8060] font-bold animate-pulse tracking-widest text-sm uppercase">Loading Fun...</p>
    </div>
  );
};

export default LoadingToy;
