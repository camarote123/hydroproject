import { createClient } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Navbar from './navbar';
import './rhydro.css';

const supabaseUrl = 'https://gwpdficziacsggfhtsff.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cGRmaWN6aWFjc2dnZmh0c2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MDcxNzMsImV4cCI6MjA1MTQ4MzE3M30.k251ml-KLw4M7TTtcpZyHh659qoO0HI9wCNUihwzxqM';
const supabase = createClient(supabaseUrl, supabaseKey);

const Rhydro = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [recordsForDate, setRecordsForDate] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: registrationData, error } = await supabase
        .from('registration')
        .select('*')
        .eq('growth_site', 'Hydroponics');
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

  const handleCheckboxChange = (id) => {
    setSelectedRows((prevSelectedRows) =>
      prevSelectedRows.includes(id)
        ? prevSelectedRows.filter((rowId) => rowId !== id)
        : [...prevSelectedRows, id]
    );
  };

  const handleTransfer = async () => {
    const rowsToTransfer = data
      .filter((record) => selectedRows.includes(record.id))
      .map((record) => ({
        growth_site: record.growth_site,
        plant_name: record.plant_name,
        registration_id: record.id,
        harvest_duration: record.harvest_duration,
        date_created: record.date_created,
      }));

    try {
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

      setData((prevData) => prevData.filter((record) => !selectedRows.includes(record.id)));
      setSelectedRows([]);
      alert('Data successfully transferred and deleted!');
    } catch (err) {
      console.error('Unexpected error during data transfer and deletion:', err);
    }
  };

  const handleDateClick = async (date) => {
    // Convert selected date to PH time (UTC+8)
    const phDate = new Date(date);
    phDate.setHours(phDate.getHours() + 8); // Adjust to UTC+8
  
    setSelectedDate(phDate);
    setLoading(true);
    try {
      const { data: registrationData, error } = await supabase
        .from('registration')
        .select('*')
        .eq('growth_site', 'Hydroponics')
        .eq('expected_harvest_date', phDate.toISOString().split('T')[0]); // Ensure correct date format
  
      if (error) {
        console.error('Error fetching records for date:', error.message);
      } else {
        setRecordsForDate(registrationData);
      }
    } catch (err) {
      console.error('Unexpected error fetching records for date:', err);
    } finally {
      setLoading(false);
      setIsModalOpen(true);
    }
  };
  

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      return data.some(record => {
        const recordDate = new Date(record.expected_harvest_date);
        recordDate.setHours(recordDate.getHours() + 8); // Convert to PH Time
  
        return recordDate.toDateString() === date.toDateString();
      }) ? 'highlight' : null;
    }
    return null;
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="full-screen-container">
      <Navbar />
      <h1>Hydroponics Plant Registration</h1>

      <div className="calendar-container">
        <Calendar
          onClickDay={handleDateClick}
          tileClassName={tileClassName}
        />
      </div>

      {isModalOpen && (
        <div className="modal1">
          <div className="modal1-container">
            <div className="modal1-content">
              <span className="close-button" onClick={closeModal}>&times;</span>
              <h2>Records for {selectedDate.toDateString()}</h2>
              <div className="table1-container">
                <table className="day1-table">
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Plant Name</th>
                      <th>PLANT ID</th>
                      <th>pH Level</th>
                      <th>Temperature</th>
                      <th>Humidity</th>
                      <th>Harvest Duration (Days)</th>
                      <th>Date Created</th>
                      <th>Expected Harvest Date</th>
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
                        <td>{record.id}</td>
                        <td>{record.ph_level}</td>
                        <td>{record.temperature}</td>
                        <td>{record.humidity}</td>
                        <td>{record.harvest_duration}</td>
                        <td>{record.date_created}</td>
                        <td>{record.expected_harvest_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="transfer-button" onClick={handleTransfer} disabled={selectedRows.length === 0}>
                Transfer Selected Data to Harvest Table
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRows.length > 0 && (
        <div className="selected-plants">
          <h2>Selected Plants</h2>
          <ul>
            {selectedRows.map((id) => {
              const selectedRecord = data.find((record) => record.id === id);
              return <li key={id}>{selectedRecord ? selectedRecord.plant_name : 'Unknown plant'}</li>;
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Rhydro;