import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Check, X, Clock, MailOpen } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for background refresh
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MailOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs text-slate-400">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={(e) => !n.is_read && handleMarkRead(n.id, e)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start space-x-3 ${
                    n.is_read ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'
                  }`}
                >
                  <div className="mt-1 flex-shrink-0">
                    {!n.is_read ? (
                      <span className="block w-2.5 h-2.5 rounded-full bg-blue-600" />
                    ) : (
                      <Check className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${n.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <div className="flex items-center space-x-1 mt-1 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(n.created_at)}</span>
                    </div>
                  </div>

                  {!n.is_read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkRead(n.id, e)}
                      title="Mark as read"
                      className="text-slate-400 hover:text-blue-600 p-1 rounded transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
