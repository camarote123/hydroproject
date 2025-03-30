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
    { id: 'temp_notification', label: 'Temperature' },
    { id: 'soil_notifications', label: 'Soil Moisture' } // Combined tab
  ];

  const soilNotificationTables = [
    { id: 'soil_notification1', label: 'Soil 1' },
    { id: 'soil_notification2', label: 'Soil 2' },
    { id: 'soil_notification3', label: 'Soil 3' },
    { id: 'soil_notification4', label: 'Soil 4' }
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

      const tables = notificationTables.map(tab => tab.id).filter(id => id !== 'soil_notifications');
      
      try {
        const results = await Promise.all([
          ...tables.map(table => supabase.from(table).select('notif, date')),
          ...soilNotificationTables.map(({ id }) => supabase.from(id).select('notif, date'))
        ]);

        const notificationsData = {};
        const newCounts = {};

        let totalNewNotifications = 0;
        
        // Regular notification tables
        results.slice(0, tables.length).forEach(({ data, error }, index) => {
          const tableId = tables[index];
          if (!error && data) {
            const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
            notificationsData[tableId] = sortedData;

            const lastSeen = lastSeenTimestamps[tableId] || 0;
            const newCount = sortedData.filter(notification => new Date(notification.date).getTime() > lastSeen).length;

            newCounts[tableId] = newCount;
            totalNewNotifications += newCount;
          } else {
            notificationsData[tableId] = [];
            newCounts[tableId] = 0;
          }
        });

        // Merging soil notifications with source labels
        const soilData = results.slice(tables.length)
          .flatMap(({ data }, index) => 
            data ? data.map(notification => ({
              ...notification,
              source: soilNotificationTables[index].label // Add "Soil 1", "Soil 2", etc.
            })) : []
          );

        const sortedSoilData = soilData.sort((a, b) => new Date(b.date) - new Date(a.date));
        notificationsData['soil_notifications'] = sortedSoilData;

        const lastSeenSoil = lastSeenTimestamps['soil_notifications'] || 0;
        const newSoilCount = sortedSoilData.filter(notification => new Date(notification.date).getTime() > lastSeenSoil).length;

        newCounts['soil_notifications'] = newSoilCount;
        totalNewNotifications += newSoilCount;

        setNotificationsMap(notificationsData);
        setNewNotificationsCounts(newCounts);
        localStorage.setItem('newNotificationsCount', totalNewNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to real-time updates for each notification table
    const subscriptions = [
      ...notificationTables.map(({ id }) => 
        id !== 'soil_notifications' 
          ? supabase.channel(id).on('postgres_changes', { event: 'INSERT', schema: 'public', table: id }, fetchNotifications).subscribe()
          : null
      ),
      ...soilNotificationTables.map(({ id }) =>
        supabase.channel(id).on('postgres_changes', { event: 'INSERT', schema: 'public', table: id }, fetchNotifications).subscribe()
      )
    ].filter(Boolean);

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
          <div className="notification-table-container">
            <table className="notification-table">
              <thead>
                <tr>
                  <th className="date-column">Date</th>
                  {activeTab === 'soil_notifications' && <th>Source</th>}
                  <th>Notification</th>
                </tr>
              </thead>
              <tbody>
                {notificationsMap[activeTab] && notificationsMap[activeTab].length > 0 ? (
                  notificationsMap[activeTab].map((notification, index) => (
                    <tr key={index} className="notification-row">
                      <td className="date-column">{new Date(notification.date).toLocaleString()}</td>
                      {activeTab === 'soil_notifications' && <td>{notification.source}</td>}
                      <td>{notification.notif}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="no-notifications">
                      No {notificationTables.find(tab => tab.id === activeTab)?.label} notifications available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
