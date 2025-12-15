import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, X, Volume2, VolumeX } from 'lucide-react';
import { markAsRead, markAllAsRead, removeNotification, toggleSound } from '../store/notificationSlice';

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  
  const { notifications, unreadCount, soundEnabled } = useSelector(state => state.notifications);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-green-100 hover:text-white transition-colors"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#1a1a1a] shadow-lg rounded-xl overflow-hidden z-50 border border-gray-700 max-h-96">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-white font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => dispatch(toggleSound())}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title={soundEnabled ? 'Disable sound' : 'Enable sound'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={() => dispatch(markAllAsRead())}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-900/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm ${!notification.read ? 'text-white font-medium' : 'text-gray-300'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(removeNotification(notification.id));
                      }}
                      className="text-gray-400 hover:text-white transition-colors ml-2"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full absolute left-1 top-1/2 transform -translate-y-1/2"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;