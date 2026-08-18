import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Building, Warehouse, Shield } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-text mb-8">My Profile</h1>
      
      <div className="bg-surface rounded-xl border border-border p-8 shadow-xl">
        <div className="flex items-center space-x-6 mb-8 pb-8 border-b border-border">
          <div className="h-24 w-24 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center overflow-hidden">
            {user.profile_photo ? (
              <img src={user.profile_photo} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <User className="h-12 w-12 text-blue-400" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text">{user.full_name}</h2>
            <p className="text-textMuted flex items-center mt-1">
              <Mail className="h-4 w-4 mr-2" /> {user.email}
            </p>
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium">
              <Shield className="h-4 w-4 mr-1.5" />
              {user.role.replace('_', ' ')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-text mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2 text-textMuted" />
              Organization Details
            </h3>
            <div className="space-y-4">
              <div className="bg-background/50 p-4 rounded-lg border border-border">
                <p className="text-sm text-textMuted mb-1">Organization ID</p>
                <p className="text-text font-medium">{user.organization_id || 'Not assigned'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text mb-4 flex items-center">
              <Warehouse className="h-5 w-5 mr-2 text-textMuted" />
              Workspace / Warehouse
            </h3>
            <div className="space-y-4">
              <div className="bg-background/50 p-4 rounded-lg border border-border">
                <p className="text-sm text-textMuted mb-1">Warehouse ID</p>
                <p className="text-text font-medium">{user.warehouse_id || 'Not assigned'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex justify-end space-x-4">
          <button className="px-6 py-2 rounded-lg bg-surface hover:bg-surface/80 text-text font-medium transition-colors border border-border">
            Change Password
          </button>
          <button className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-lg shadow-blue-500/20">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}
