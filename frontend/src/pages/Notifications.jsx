import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { markAsRead, removeNotification, toggleSound } from '../store/notificationSlice';
import { Volume2, VolumeX, X } from 'lucide-react';

function Notifications() {
  const dispatch = useDispatch();
  const { notifications, soundEnabled } = useSelector(state => state.notifications);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      dispatch(markAsRead(notification.id));
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] p-4 pt-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <button
            onClick={() => dispatch(toggleSound())}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </button>
        </div>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-[#1a1a1a] rounded-xl p-4 border border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer ${
                  !notification.read ? 'border-blue-500 bg-blue-900/20' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`font-semibold ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                      {notification.title}
                    </h3>
                    <p className="text-gray-400 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(removeNotification(notification.id));
                    }}
                    className="text-gray-400 hover:text-white transition-colors ml-4"
                  >
                    <X size={18} />
                  </button>
                </div>
                {!notification.read && (
                  <div className="w-3 h-3 bg-blue-500 rounded-full absolute right-2 top-2"></div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Notifications;