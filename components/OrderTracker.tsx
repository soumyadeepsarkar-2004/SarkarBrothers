
import React from 'react';

interface OrderTrackerProps {
    status: 'Processing' | 'Shipped' | 'Delivered' | string;
}

const LiveMap: React.FC = () => {
    return (
        <div className="relative w-full h-64 bg-[#e8e6e1] dark:bg-[#1f1b13] rounded-xl overflow-hidden border border-[#dcd9d0] dark:border-[#332f20] relative group">
            {/* Map Grid Pattern */}
            <div className="absolute inset-0 opacity-20" 
                 style={{ 
                     backgroundImage: 'linear-gradient(#8a8060 1px, transparent 1px), linear-gradient(90deg, #8a8060 1px, transparent 1px)', 
                     backgroundSize: '40px 40px' 
                 }}>
            </div>

            {/* Road */}
            <div className="absolute top-1/2 left-0 w-full h-16 -translate-y-1/2 bg-white dark:bg-[#332f20] border-y-4 border-[#dcd9d0] dark:border-[#443f30]">
                {/* Lane markings */}
                <div className="absolute top-1/2 left-0 w-full h-0 border-t-2 border-dashed border-gray-300 dark:border-gray-600"></div>
            </div>

            {/* Trees/Decorations (Simulated) */}
            <div className="absolute top-10 left-10 text-green-700/30 text-4xl select-none">🌳</div>
            <div className="absolute bottom-10 right-20 text-green-700/30 text-5xl select-none">🌲</div>
            <div className="absolute top-5 right-1/3 text-green-700/20 text-3xl select-none">🌳</div>

            {/* Destination Home */}
            <div className="absolute right-10 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                <div className="size-12 bg-white dark:bg-[#252525] rounded-full border-4 border-primary shadow-lg flex items-center justify-center z-20">
                    <span className="material-symbols-outlined text-primary">home</span>
                </div>
                <div className="mt-2 bg-white/90 dark:bg-black/80 px-2 py-1 rounded text-[10px] font-bold shadow-sm">
                    Home
                </div>
            </div>

            {/* Moving Truck Wrapper */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 animate-[drive_10s_linear_infinite]">
                 <div className="relative -top-8 transition-transform duration-500 hover:scale-110">
                    {/* Pulsing GPS Signal */}
                    <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping"></div>
                    
                    {/* Truck Icon */}
                    <div className="size-12 bg-blue-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center relative z-10">
                        <span className="material-symbols-outlined text-white text-[20px]">local_shipping</span>
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap shadow-lg">
                        Arriving in 15m
                        <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rotate-45"></div>
                    </div>
                 </div>
            </div>

            {/* Styles for animation */}
            <style>{`
                @keyframes drive {
                    0% { left: -5%; }
                    100% { left: 85%; }
                }
            `}</style>

            {/* Overlay Info */}
            <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-[#252525]/90 backdrop-blur-md p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
                 <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                    <span className="material-symbols-outlined">person</span>
                 </div>
                 <div>
                    <p className="text-xs font-bold text-[#181611] dark:text-white">Courier: Rajesh Kumar</p>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <span className="material-symbols-outlined text-[10px] text-yellow-500 fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        4.9 Rating
                    </div>
                 </div>
                 <button className="ml-2 size-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-sm">call</span>
                 </button>
            </div>
        </div>
    );
};


const OrderTracker: React.FC<OrderTrackerProps> = ({ status }) => {
    const statuses = ['Processing', 'Shipped', 'Delivered'];
    const currentStatusIndex = statuses.indexOf(status);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center text-sm font-bold text-gray-500 dark:text-gray-400">
                {statuses.map((s, i) => (
                    <span key={s} className={`flex-1 text-center ${i <= currentStatusIndex ? 'text-primary dark:text-yellow-400' : ''}`}>
                        {s}
                    </span>
                ))}
            </div>
            <div className="relative flex items-center h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div
                    className="absolute h-2 bg-primary rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${(currentStatusIndex / (statuses.length - 1)) * 100}%` }}
                ></div>
                {statuses.map((s, i) => (
                    <div
                        key={s}
                        className={`absolute flex items-center justify-center size-5 rounded-full border-2 transition-all duration-500 ease-in-out ${
                            i <= currentStatusIndex
                                ? 'bg-primary border-primary'
                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                        }`}
                        style={{ left: `${(i / (statuses.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}
                    >
                        {i < currentStatusIndex ? (
                            <span className="material-symbols-outlined text-white text-[12px]">check</span>
                        ) : i === currentStatusIndex ? (
                            <span className="material-symbols-outlined text-white text-[12px]">local_shipping</span>
                        ) : null}
                    </div>
                ))}
            </div>
            {status === 'Shipped' && (
                <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
                    <LiveMap />
                </div>
            )}
        </div>
    );
};

export default OrderTracker;
