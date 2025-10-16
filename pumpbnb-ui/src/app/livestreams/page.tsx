import React from 'react';

export default function LivestreamsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">Livestreams</h1>
        <p className="text-text-secondary">Watch live token trading and community discussions</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder livestream cards */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-background-card rounded-lg border border-border overflow-hidden">
            <div className="aspect-video bg-background-sidebar flex items-center justify-center">
              <div className="text-text-secondary">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white font-bold">LIVE</span>
                </div>
                <p className="text-center">Stream {i}</p>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-text-primary mb-2">Trading Session {i}</h3>
              <p className="text-text-secondary text-sm mb-2">125 viewers</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary-green rounded-full"></div>
                <span className="text-text-secondary text-sm">Trader{i}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}