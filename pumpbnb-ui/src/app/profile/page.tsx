import React from 'react';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">Profile</h1>
        <p className="text-text-secondary">Manage your account and trading preferences</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-background-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Account Information</h2>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-primary-green rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-xl">U</span>
              </div>
              <div>
                <div className="text-text-primary font-semibold">User #1234</div>
                <div className="text-text-secondary">0x1234...5678</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-text-primary font-medium mb-2">Display Name</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-background-sidebar border border-border rounded-lg text-text-primary"
                  placeholder="Enter display name"
                />
              </div>
              
              <div>
                <label className="block text-text-primary font-medium mb-2">Bio</label>
                <textarea 
                  className="w-full px-3 py-2 bg-background-sidebar border border-border rounded-lg text-text-primary h-24 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
              
              <Button className="bg-primary-green text-black hover:bg-green-400">
                Save Changes
              </Button>
            </div>
          </div>
          
          {/* Trading History */}
          <div className="bg-background-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Recent Trades</h2>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-background-sidebar rounded">
                  <div>
                    <div className="font-medium text-text-primary">TOKEN{i}</div>
                    <div className="text-text-secondary text-sm">2 hours ago</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400">+$123.45</div>
                    <div className="text-text-secondary text-sm">Buy</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Stats Sidebar */}
        <div className="space-y-6">
          <div className="bg-background-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Trading Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Total Trades</span>
                <span className="text-text-primary font-medium">47</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Win Rate</span>
                <span className="text-green-400 font-medium">68%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Total PnL</span>
                <span className="text-green-400 font-medium">+$1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Best Trade</span>
                <span className="text-green-400 font-medium">+$456</span>
              </div>
            </div>
          </div>
          
          <div className="bg-background-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Achievements</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-background-sidebar rounded">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  🥇
                </div>
                <div>
                  <div className="font-medium text-text-primary">First Trade</div>
                  <div className="text-text-secondary text-sm">Complete your first trade</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-background-sidebar rounded opacity-50">
                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                  🏆
                </div>
                <div>
                  <div className="font-medium text-text-primary">100 Trades</div>
                  <div className="text-text-secondary text-sm">Make 100 successful trades</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}