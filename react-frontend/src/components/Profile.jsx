import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from './layout/Navbar';
import endpoints from '../config/api';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: user.bio || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateBio = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(endpoints.updateBio, {
        bio: formData.bio
      });
      
      const updatedUser = { ...user, bio: response.data.bio };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);
      setSuccess('Bio updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Error updating bio');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      await api.put(endpoints.updatePassword, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSuccess('Password updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Error updating password');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Profile Header */}
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="mx-6 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mx-6 mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* Profile Info */}
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.fullName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bio</dt>
                  {isEditing ? (
                    <form onSubmit={handleUpdateBio} className="mt-1">
                      <textarea
                        name="bio"
                        rows="3"
                        value={formData.bio}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                      <div className="mt-2 flex space-x-2">
                        <button
                          type="submit"
                          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-1">
                      <dd className="text-sm text-gray-900">{user.bio || 'No bio yet'}</dd>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                      >
                        Edit bio
                      </button>
                    </div>
                  )}
                </div>
              </dl>
            </div>

            {/* Change Password */}
            <div className="pt-6 border-t">
              <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
              <form onSubmit={handleUpdatePassword} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    id="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    id="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 