
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
    // Mock Timeline Data
    const timeline = [
        { time: '09:30 AM', date: 'Today', status: 'Out for Delivery', location: 'Local Hub, Springfield', current: status === 'Shipped' },
        { time: '06:15 AM', date: 'Today', status: 'Arrived at Facility', location: 'Distribution Center, Springfield', current: false },
        { time: '08:45 PM', date: 'Yesterday', status: 'In Transit', location: 'Central Cargo, Chicago', current: false },
        { time: '04:30 PM', date: 'Yesterday', status: 'Shipped', location: 'ToyWonder Warehouse', current: false },
        { time: '02:00 PM', date: 'Oct 24', status: 'Order Confirmed', location: 'Online Store', current: false },
    ];

    // Filter timeline based on status for realism
    const visibleTimeline = status === 'Processing' 
        ? timeline.slice(4) 
        : status === 'Delivered' 
            ? [{ time: '10:45 AM', date: 'Today', status: 'Delivered', location: 'Front Door', current: true }, ...timeline] 
            : timeline;

    return (
        <div className="w-full">
            {/* Horizontal Status Bar */}
            <div className="flex items-center justify-between mb-8 relative px-2">
                <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 dark:bg-[#332f20] -z-10 rounded-full"></div>
                <div className={`absolute left-0 top-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-1000`} 
                     style={{ width: status === 'Delivered' ? '100%' : status === 'Shipped' ? '66%' : '33%' }}>
                </div>

                {['Ordered', 'Processing', 'Shipped', 'Delivered'].map((step, i) => {
                    const isCompleted = 
                        (status === 'Processing' && i <= 1) ||
                        (status === 'Shipped' && i <= 2) ||
                        (status === 'Delivered' && i <= 3);
                    
                    const isCurrent = 
                        (status === 'Processing' && i === 1) ||
                        (status === 'Shipped' && i === 2) ||
                        (status === 'Delivered' && i === 3);

                    return (
                        <div key={step} className="flex flex-col items-center gap-2 bg-background-light dark:bg-background-dark px-2">
                             <div className={`size-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isCompleted ? 'bg-primary border-primary text-[#181611]' : 'bg-white dark:bg-[#252525] border-gray-300 dark:border-gray-600 text-gray-300'}`}>
                                 {isCompleted ? <span className="material-symbols-outlined text-sm font-bold">check</span> : <div className="size-2 rounded-full bg-gray-300"></div>}
                             </div>
                             <span className={`text-xs font-bold ${isCurrent ? 'text-primary' : 'text-gray-500'}`}>{step}</span>
                        </div>
                    );
                })}
            </div>

            {/* Live Map for Shipped Status */}
            {status === 'Shipped' && (
                <div className="animate-[fadeIn_0.5s_ease-out]">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-[#181611] dark:text-white flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            Live Tracking
                        </h4>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">Est. Delivery: Today, 2 PM</span>
                    </div>
                    <LiveMap />
                </div>
            )}

            {/* Detailed Timeline */}
            <div className="mt-8 space-y-6 relative pl-2">
                <div className="absolute top-2 bottom-2 left-[19px] w-0.5 bg-gray-200 dark:bg-[#332f20]"></div>
                
                {visibleTimeline.map((log, idx) => (
                    <div key={idx} className={`relative flex gap-6 ${log.current ? 'opacity-100' : 'opacity-70'}`}>
                        <div className={`relative z-10 size-10 rounded-full border-4 flex items-center justify-center shrink-0 bg-white dark:bg-[#1a170d] ${log.current ? 'border-primary text-primary' : 'border-gray-200 dark:border-[#332f20] text-gray-400'}`}>
                            <span className="material-symbols-outlined text-[18px]">
                                {log.status.includes('Delivered') ? 'check_circle' : 
                                 log.status.includes('Out') ? 'local_shipping' : 
                                 log.status.includes('Transit') ? 'flight' : 'inventory_2'}
                            </span>
                        </div>
                        <div className="flex-1 pt-1">
                            <h5 className={`font-bold text-sm ${log.current ? 'text-[#181611] dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{log.status}</h5>
                            <p className="text-xs text-gray-500 mb-1">{log.location}</p>
                            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-[#252525] px-2 py-0.5 rounded">{log.date} • {log.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrderTracker;
