import React, { useEffect, useRef, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from './createClient';
import Navbar from './navbar';
import Navbar2 from './navbar2';
import './rhydro.css';

const Rhydro = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [recordsForDate, setRecordsForDate] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [highlightedDates, setHighlightedDates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [modalFetchingData, setModalFetchingData] = useState(false);
  const modalRef = useRef(null);
  const calendarRef = useRef(null);
  const [modalMouseOver, setModalMouseOver] = useState(false);
  const [shouldCloseModal, setShouldCloseModal] = useState(false);
  const closeModalTimeoutRef = useRef(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isModalPinned, setIsModalPinned] = useState(false);
  const notificationTimerRef = useRef(null);
  const notificationSubscriptionRef = useRef(null);

  useEffect(() => {
    fetchData();
    fetchNotifications();

    // Set up real-time subscription for notifications table
    setupNotificationSubscription();

    // Initial check when component loads
    checkForNotifications();

    // Set up a timer to check for notifications every hour
    notificationTimerRef.current = setInterval(() => {
      checkForNotifications();
    }, 3600000); // check every hour (3600000 ms)

    return () => {
      // Clean up resources on component unmount
      if (notificationTimerRef.current) {
        clearInterval(notificationTimerRef.current);
      }
      if (closeModalTimeoutRef.current) {
        clearTimeout(closeModalTimeoutRef.current);
      }
      // Clean up subscription
      if (notificationSubscriptionRef.current) {
        notificationSubscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  // Setup notification subscription as a separate function to ensure proper cleanup
  const setupNotificationSubscription = () => {
    // Unsubscribe from previous subscription if it exists
    if (notificationSubscriptionRef.current) {
      notificationSubscriptionRef.current.unsubscribe();
    }

    // Create new subscription
    notificationSubscriptionRef.current = supabase
      .channel('date_notifications_changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'date_notifications' 
      }, payload => {
        console.log('New notification received:', payload);
        // Whenever there's a new notification, refresh the notifications
        fetchNotifications();
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to date_notifications table');
        }
      });
  };

  // Update notification count when notifications change
  useEffect(() => {
    setNotificationCount(notifications.length);
  }, [notifications]);

  // Reset notification count when notifications panel is opened
  useEffect(() => {
    if (showNotifications) {
      setNotificationCount(0);
    }
  }, [showNotifications]);

  useEffect(() => {
    // Extract and format dates for highlighting on calendar
    if (data.length > 0) {
      const dates = data.map(record => {
        const recordDate = new Date(record.expected_harvest_date);
        recordDate.setHours(recordDate.getHours() + 8); // Convert to PH Time
        return recordDate.toDateString();
      });
      setHighlightedDates([...new Set(dates)]); // Remove duplicates
    }
  }, [data]);

  useEffect(() => {
    // Handle modal close logic when mouse leaves calendar but not when over modal
    // Only close if it's not pinned by a click
    if (shouldCloseModal && !modalMouseOver && !isModalPinned) {
      closeModal();
    }
    setShouldCloseModal(false);
  }, [shouldCloseModal, modalMouseOver, isModalPinned]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('date_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error.message);
      } else {
        console.log('Fetched notifications:', data);
        setNotifications(data || []);
        // Update notification count immediately
        if (!showNotifications) {
          setNotificationCount(data.length);
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching notifications:', err);
    }
  };

  const checkForNotifications = async () => {
    if (data.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get existing notifications to avoid duplicates
    const { data: existingNotifications, error: fetchError } = await supabase
      .from('date_notifications')
      .select('plant_name, harvest_date, message');

    if (fetchError) {
      console.error('Error checking existing notifications:', fetchError.message);
      return;
    }

    // Track which notifications to create
    const notificationsToCreate = [];

    data.forEach(plant => {
      const harvestDate = new Date(plant.expected_harvest_date);
      harvestDate.setHours(0, 0, 0, 0);

      const daysUntilHarvest = Math.ceil((harvestDate - today) / (1000 * 60 * 60 * 24));
      
      // Function to check if notification already exists
      const notificationExists = (message) => {
        return existingNotifications.some(n => 
          n.plant_name === plant.plant_name && 
          n.message === message &&
          new Date(n.harvest_date).toDateString() === new Date(plant.expected_harvest_date).toDateString()
        );
      };

      // Check for specific notification days
      if (daysUntilHarvest === 14) {
        const message = `${plant.plant_name} will be ready for harvest in 14 days.`;
        if (!notificationExists(message)) {
          notificationsToCreate.push({
            message,
            plant_name: plant.plant_name,
            harvest_date: plant.expected_harvest_date
          });
        }
      } else if (daysUntilHarvest === 7) {
        const message = `${plant.plant_name} will be ready for harvest in 7 days.`;
        if (!notificationExists(message)) {
          notificationsToCreate.push({
            message,
            plant_name: plant.plant_name,
            harvest_date: plant.expected_harvest_date
          });
        }
      } else if (daysUntilHarvest === 4) {
        const message = `${plant.plant_name} will be ready for harvest in 4 days.`;
        if (!notificationExists(message)) {
          notificationsToCreate.push({
            message,
            plant_name: plant.plant_name,
            harvest_date: plant.expected_harvest_date
          });
        }
      } else if (daysUntilHarvest === 2) {
        const message = `${plant.plant_name} will be ready for harvest in 2 days.`;
        if (!notificationExists(message)) {
          notificationsToCreate.push({
            message,
            plant_name: plant.plant_name,
            harvest_date: plant.expected_harvest_date
          });
        }
      } else if (daysUntilHarvest === 1) {
        const message = `${plant.plant_name} will be ready for harvest tomorrow.`;
        if (!notificationExists(message)) {
          notificationsToCreate.push({
            message,
            plant_name: plant.plant_name,
            harvest_date: plant.expected_harvest_date
          });
        }
      } else if (daysUntilHarvest === 0) {
        const message = `${plant.plant_name} is ready for harvest today!`;
        if (!notificationExists(message)) {
          notificationsToCreate.push({
            message,
            plant_name: plant.plant_name,
            harvest_date: plant.expected_harvest_date
          });
        }
      } else if (daysUntilHarvest < 0) {
        // Overdue notifications
        const message = `${plant.plant_name} is ${Math.abs(daysUntilHarvest)} day(s) overdue for harvest!`;
        if (!notificationExists(message)) {
          notificationsToCreate.push({
            message,
            plant_name: plant.plant_name,
            harvest_date: plant.expected_harvest_date
          });
        }
      }
    });

    console.log('Notifications to create:', notificationsToCreate);

    // Save notifications to Supabase
    if (notificationsToCreate.length > 0) {
      try {
        const { data: insertedData, error } = await supabase
          .from('date_notifications')
          .insert(notificationsToCreate)
          .select();

        if (error) {
          console.error('Error creating notifications:', error.message);
        } else {
          console.log('Successfully created notifications:', insertedData);
          // Show the most recent notification as a toast
          if (notificationsToCreate[0]) {
            showNotificationToast(notificationsToCreate[0].message);
          }
        }
      } catch (err) {
        console.error('Unexpected error creating notifications:', err);
      }
    }
  };

  const showNotificationToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      document.body.removeChild(toast);
    }, 5000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: registrationData, error } = await supabase
        .from('registration')
        .select('*')
        .in('growth_site', ['Soil Based', 'Hydroponics']);

      if (error) {
        console.error('Error fetching data:', error.message);
      } else {
        setData(registrationData);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getColor = (growthSite) => {
    return { color: growthSite === "Hydroponics" ? "blue" : "green" };
  };

  const handleCheckboxChange = (id) => {
    setSelectedRows((prevSelectedRows) =>
      prevSelectedRows.includes(id)
        ? prevSelectedRows.filter((rowId) => rowId !== id)
        : [...prevSelectedRows, id]
    );
  };

  const handleTransfer = async () => {
    try {
      const rowsToTransfer = data
        .filter((record) => selectedRows.includes(record.id))
        .map((record) => ({
          growth_site: record.growth_site,
          plant_name: record.plant_name,
          registration_id: record.id,
          harvest_duration: record.harvest_duration,
          date_created: record.date_created,
        }));

      const { error: insertError } = await supabase.from('harvest').insert(rowsToTransfer);

      if (insertError) {
        console.error('Error transferring data:', insertError.message);
        return;
      }

      const { error: deleteError } = await supabase
        .from('registration')
        .delete()
        .in('id', selectedRows);

      if (deleteError) {
        console.error('Error deleting data:', deleteError.message);
        return;
      }

      // Create harvest notification
      const harvestedPlants = data.filter((record) => selectedRows.includes(record.id));

      // Create notifications for harvested plants
      const harvestNotifications = harvestedPlants.map(plant => ({
        message: `${plant.plant_name} has been successfully harvested.`,
        plant_name: plant.plant_name,
        harvest_date: plant.expected_harvest_date
      }));

      if (harvestNotifications.length > 0) {
        const { error: notifError } = await supabase
          .from('date_notifications')
          .insert(harvestNotifications);
          
        if (notifError) {
          console.error('Error creating harvest notifications:', notifError.message);
        } else {
          console.log('Successfully created harvest notifications');
        }
      }

      // Update local state
      setData((prevData) => prevData.filter((record) => !selectedRows.includes(record.id)));
      setRecordsForDate((prevRecords) => prevRecords.filter((record) => !selectedRows.includes(record.id)));
      setSelectedRows([]);

      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'success-toast';
      successMessage.textContent = 'Plants successfully harvested!';
      document.body.appendChild(successMessage);

      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);

    } catch (err) {
      console.error('Unexpected error during data transfer and deletion:', err);
    }
  };

  // Calculate if a date has records
  const hasRecordsForDate = (date) => {
    const dateString = date.toDateString();
    return data.some((record) => {
      const recordDate = new Date(record.expected_harvest_date);
      recordDate.setHours(recordDate.getHours() + 8); // Convert to PH Time
      return recordDate.toDateString() === dateString;
    });
  };

  // New function to handle date click
  const handleDateClick = async (date, event) => {
    // First check if this date has any records - don't do anything if no records
    if (!hasRecordsForDate(date)) {
      return;
    }

    // Set modal as pinned so it won't close on mouse leave
    setIsModalPinned(true);

    // Update position of the modal based on click position
    if (event && event.target) {
      const rect = event.target.getBoundingClientRect();

      // Calculate positions to ensure modal is fully visible
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const modalWidth = 800;
      const modalHeight = 500;

      // Calculate positions - similar to hover calculation
      let xPos = rect.right + 10;
      if (xPos + modalWidth > windowWidth) {
        xPos = Math.max(10, rect.left - modalWidth - 10);
      }

      let yPos = rect.top;
      if (yPos + modalHeight > windowHeight) {
        yPos = Math.max(10, windowHeight - modalHeight - 10);
      }

      setHoverPosition({
        x: xPos,
        y: yPos
      });
    }

    // Convert selected date to PH time (UTC+8)
    const phDate = new Date(date);
    phDate.setHours(phDate.getHours() + 8); // Adjust to UTC+8

    setSelectedDate(phDate);

    // Fetch records for the selected date
    setModalFetchingData(true);
    try {
      const { data: registrationData, error } = await supabase
        .from('registration')
        .select('*')
        .in('growth_site', ['Soil Based', 'Hydroponics'])
        .eq('expected_harvest_date', phDate.toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching records for date:', error.message);
      } else {
        setRecordsForDate(registrationData);
        setSelectedRows([]);

        // Only open modal if there are records for this date
        if (registrationData.length > 0) {
          setIsModalOpen(true);
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching records for date:', err);
    } finally {
      setModalFetchingData(false);
    }
  };

  // Modified to use mouseenter and to check if date has records first
  const handleDateHover = async (date, event) => {
    // Don't do anything on hover if modal is already pinned by click
    if (isModalPinned) {
      return;
    }

    // First check if this date has any records - don't open modal otherwise
    if (!hasRecordsForDate(date)) {
      setIsModalOpen(false);
      return;
    }

    // Clear any pending close timeouts
    if (closeModalTimeoutRef.current) {
      clearTimeout(closeModalTimeoutRef.current);
      closeModalTimeoutRef.current = null;
    }

    // Store the position of the hovered date tile
    if (event && event.target) {
      const rect = event.target.getBoundingClientRect();

      // Calculate positions to ensure modal is fully visible
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const modalWidth = 800;
      const modalHeight = 500; // Approximate modal height

      // Calculate x position - ensure it doesn't go off-screen
      let xPos = rect.right + 10;
      if (xPos + modalWidth > windowWidth) {
        xPos = Math.max(10, rect.left - modalWidth - 10);
      }

      // Calculate y position - ensure it doesn't go off-screen
      let yPos = rect.top;
      if (yPos + modalHeight > windowHeight) {
        yPos = Math.max(10, windowHeight - modalHeight - 10);
      }

      setHoverPosition({
        x: xPos,
        y: yPos
      });
    }

    // Convert selected date to PH time (UTC+8)
    const phDate = new Date(date);
    phDate.setHours(phDate.getHours() + 8); // Adjust to UTC+8

    setSelectedDate(phDate);

    // Set modal fetching data flag instead of global loading
    setModalFetchingData(true);
    try {
      const { data: registrationData, error } = await supabase
        .from('registration')
        .select('*')
        .in('growth_site', ['Soil Based', 'Hydroponics'])
        .eq('expected_harvest_date', phDate.toISOString().split('T')[0]); // Ensure correct date format

      if (error) {
        console.error('Error fetching records for date:', error.message);
      } else {
        setRecordsForDate(registrationData);
        setSelectedRows([]); // Reset selections when changing date

        // Only open modal if there are records for this date
        if (registrationData.length > 0) {
          setIsModalOpen(true);
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching records for date:', err);
    } finally {
      setModalFetchingData(false);
    }
  };

  // Handle mouse leave event for the calendar
  const handleCalendarMouseLeave = () => {
    // Only set shouldCloseModal if modal is not pinned
    if (!isModalPinned) {
      setShouldCloseModal(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsModalPinned(false); // Reset the pinned state when closing
  };

  const toggleNotifications = () => {
    // Reset notification count when opening notifications panel
    if (!showNotifications) {
      setNotificationCount(0);
    }
    setShowNotifications(!showNotifications);
  };

  // Modal mouse events
  const handleModalMouseEnter = () => {
    setModalMouseOver(true);
    if (closeModalTimeoutRef.current) {
      clearTimeout(closeModalTimeoutRef.current);
      closeModalTimeoutRef.current = null;
    }
  };

  const handleModalMouseLeave = () => {
    setModalMouseOver(false);
    // Only set up closing if not pinned
    if (!isModalPinned) {
      closeModalTimeoutRef.current = setTimeout(() => {
        if (!modalMouseOver && !isModalPinned) {
          closeModal();
        }
      }, 300); // Short delay to allow for mouse movement between calendar and modal
    }
  };

  // Custom tile content to add mouse events
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      return (
        <div
          className="date-tile-content"
          onMouseEnter={(e) => handleDateHover(date, e)}
          onClick={(e) => handleDateClick(date, e)}
        ></div>
      );
    }
    return null;
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateString = date.toDateString();
      let highlightClass = null;

      data.forEach((record) => {
        const recordDate = new Date(record.expected_harvest_date);
        recordDate.setHours(recordDate.getHours() + 8); // Convert to PH Time
        if (recordDate.toDateString() === dateString) {
          if (record.growth_site === "Hydroponics") {
            highlightClass = 'highlight-hydro';
          } else if (record.growth_site === "Soil Based") {
            highlightClass = 'highlight-soil';
          }
        }
      });

      return highlightClass;
    }
    return null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    }).format(date);
  };

  // Only show loading indicator during initial data fetch
  if (loading && !data.length) {
    return (
      <div className="loading-indicator">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="full-screen-container">
      <Navbar />
      <Navbar2 />
      <div className="page-header">
        <h1>Plants Record</h1>
        <div className="notification-icon" onClick={toggleNotifications}>
          <span className="bell-icon">🔔</span>
          {notificationCount > 0 && (
            <span className="notification-badge">{notificationCount}</span>
          )}
        </div>
      </div>

      {showNotifications && (
        <div className="notifications-panel">
          <div className="notifications-header">
            <h3>Notifications</h3>
            <button className="close-notifications" onClick={toggleNotifications}>×</button>
          </div>
          <div className="notifications-list">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} className="notification-item">
                  <p className="notification-message">{notification.message}</p>
                  <p className="notification-date">{formatDate(notification.created_at)}</p>
                </div>
              ))
            ) : (
              <p className="no-notifications">No notifications</p>
            )}
          </div>
        </div>
      )}

      <div className="calendar-container" ref={calendarRef} onMouseLeave={handleCalendarMouseLeave}>
        <Calendar
          tileContent={tileContent}
          tileClassName={tileClassName}
          prevLabel={<span>←</span>}
          nextLabel={<span>→</span>}
          prev2Label={<span>«</span>}
          next2Label={<span>»</span>}
        />
      </div>

      {isModalOpen && recordsForDate.length > 0 && (
        <div
          className={`hover-modal ${isModalPinned ? 'pinned-modal' : ''}`}
          ref={modalRef}
          onMouseEnter={handleModalMouseEnter}
          onMouseLeave={handleModalMouseLeave}
          style={{
            position: "fixed",
            top: hoverPosition.y,
            left: hoverPosition.x,
            zIndex: 1000,
            maxHeight: "80vh",
            maxWidth: "800px",
            overflowY: "auto"
          }}
        >
          <div className="hover-modal-container">
            <div className="hover-modal-content">
              <span className="close-button" onClick={closeModal}>&times;</span>
              <h2>{`Records for ${selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}`}</h2>

              {modalFetchingData ? (
                <div className="modal-loading">Loading records...</div>
              ) : (
                <div className="table1-container">
                  <table className="day1-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>Select</th>
                        <th>Plant Name</th>
                        <th>Growth site</th>
                        <th>Plant ID</th>
                        <th>Location</th>
                        <th>Duration</th>
                        <th>Created</th>
                        <th>Harvest Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recordsForDate.map((record) => (
                        <tr key={record.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(record.id)}
                              onChange={() => handleCheckboxChange(record.id)}
                            />
                          </td>
                          <td>{record.plant_name}</td>
                          <td style={{ color: record.growth_site === "Hydroponics" ? "blue" : "green" }}>
                            {record.growth_site}
                          </td>
                          <td>{record.id}</td>
                          <td>{record.location}</td>
                          <td>
                            {record.harvest_duration
                              ? `${record.harvest_duration} ${record.harvest_duration == 1 ? 'day' : 'days'}`
                              : 'N/A'}
                          </td>
                          <td>{formatDate(record.date_created)}</td>
                          <td>{formatDate(record.expected_harvest_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {selectedRows.length > 0 && (
                    <span className="selected-count">
                      {selectedRows.length} plant{selectedRows.length !== 1 ? 's' : ''} selected
                    </span>
                  )}
                </div>
                <div>
                  <button
                    className="transfer-button"
                    onClick={handleTransfer}
                    disabled={selectedRows.length === 0}
                  >
                    Harvest Selected Plants
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add some additional styles for the pinned modal */}
      <style jsx="true">{`
        .pinned-modal {
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
          border: 2px solid #4a90e2;
        }
        
        .date-tile-content {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default Rhydro;