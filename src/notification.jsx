import React, { useEffect, useState } from 'react';
import { supabase } from './createClient';
import './notification.css';

const Notifications = () => {
  const notificationTables = [
    { id: 'do_notification', label: 'DO' },
    { id: 'feeder_notification', label: 'Feeder' },
    { id: 'humidity_notification', label: 'Humidity' },
    { id: 'hydro_notification', label: 'Hydro' },
    { id: 'npk_notification', label: 'NPK' },
    { id: 'pesticide_notification', label: 'Pesticide' },
    { id: 'phlevel_notification', label: 'pH Level' },
    { id: 'temp_notification', label: 'Temperature' }
  ];

  const [activeTab, setActiveTab] = useState(notificationTables[0].id);
  const [notificationsMap, setNotificationsMap] = useState({});
  const [newNotificationsCounts, setNewNotificationsCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);

      let lastSeenTimestamps = {};
      try {
        const savedTimestamps = localStorage.getItem('lastSeenTimestamps');
        if (savedTimestamps) {
          lastSeenTimestamps = JSON.parse(savedTimestamps);
        }
      } catch (error) {
        console.error('Error loading timestamps:', error);
      }

      const tables = notificationTables.map(tab => tab.id);
      
      try {
        const results = await Promise.all(
          tables.map(table => supabase.from(table).select('notif, date'))
        );

        const notificationsData = {};
        const newCounts = {};

        let totalNewNotifications = 0;

        results.forEach(({ data, error }, index) => {
          const tableId = tables[index];
          if (!error && data) {
            const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
            notificationsData[tableId] = sortedData;

            const lastSeen = lastSeenTimestamps[tableId] || 0;
            const newCount = sortedData.filter(
              notification => new Date(notification.date).getTime() > lastSeen
            ).length;

            newCounts[tableId] = newCount;
            totalNewNotifications += newCount;
          } else {
            notificationsData[tableId] = [];
            newCounts[tableId] = 0;
          }
        });

        setNotificationsMap(notificationsData);
        setNewNotificationsCounts(newCounts);

        // Update the total new notifications count in localStorage
        localStorage.setItem('newNotificationsCount', totalNewNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to real-time updates for each notification table
    const subscriptions = notificationTables.map(({ id }) =>
      supabase
        .channel(id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: id }, fetchNotifications)
        .subscribe()
    );

    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
    };
  }, []);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);

    if (notificationsMap[tabId] && notificationsMap[tabId].length > 0) {
      const latestNotificationTime = new Date(notificationsMap[tabId][0].date).getTime();

      try {
        const savedTimestamps = localStorage.getItem('lastSeenTimestamps');
        let lastSeenTimestamps = savedTimestamps ? JSON.parse(savedTimestamps) : {};
        lastSeenTimestamps[tabId] = latestNotificationTime;
        localStorage.setItem('lastSeenTimestamps', JSON.stringify(lastSeenTimestamps));

        setNewNotificationsCounts(prev => ({
          ...prev,
          [tabId]: 0
        }));

        // Update the total new notifications count in localStorage
        const totalNewNotifications = Object.values(newNotificationsCounts).reduce((a, b) => a + b, 0);
        localStorage.setItem('newNotificationsCount', totalNewNotifications);
      } catch (error) {
        console.error('Error saving timestamp:', error);
      }
    }
  };

  return (
    <div className="notification-container">
      <div className="tab-container">
        {notificationTables.map(({ id, label }) => (
          <div 
            key={id} 
            className={`tab-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => handleTabClick(id)}
          >
            {label}
            {newNotificationsCounts[id] > 0 && (
              <span className="tab-count">{newNotificationsCounts[id]}</span>
            )}
          </div>
        ))}
      </div>

      <div className="notification-content">
        {isLoading ? (
          <div className="loading-message">Loading notifications...</div>
        ) : (
          <>
            <div className="notification-table-container">
              <table className="notification-table">
                <thead>
                  <tr>
                    <th className="date-column">Date</th>
                    <th>Notification</th>
                  </tr>
                </thead>
                <tbody>
                  {notificationsMap[activeTab] && notificationsMap[activeTab].length > 0 ? (
                    notificationsMap[activeTab].map((notification, index) => (
                      <tr key={index} className="notification-row">
                        <td className="date-column">{new Date(notification.date).toLocaleString()}</td>
                        <td>{notification.notif}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="no-notifications">
                        No {notificationTables.find(tab => tab.id === activeTab)?.label} notifications available.
                      </td>
                    </tr>
                  )}
                  {/* Add empty rows to maintain consistent table size */}
                  {notificationsMap[activeTab] && notificationsMap[activeTab].length < 10 && (
                    [...Array(10 - notificationsMap[activeTab].length)].map((_, index) => (
                      <tr key={`empty-${index}`} className="empty-row">
                        <td className="date-column">&nbsp;</td>
                        <td>&nbsp;</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;