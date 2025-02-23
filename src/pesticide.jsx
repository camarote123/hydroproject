import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { supabase } from './createClient';
import Navbar from './navbar';
import './sensor.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Pesticide = () => {
  const [pumpScheduleData, setPumpScheduleData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Fetch data from Supabase based on selected date
  const fetchData = async (date) => {
    try {
      let query = supabase
        .from('pumpschedule')
        .select('*')
        .order('schedule_date', { ascending: false });

      // Apply date filtering if a date is selected
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query
          .gte('schedule_date', startOfDay.toISOString())
          .lte('schedule_date', endOfDay.toISOString());
      }

      let { data, error } = await query;
      if (error) throw error;

      setPumpScheduleData(data);
    } catch (error) {
      console.error('Error fetching pump schedule data:', error);
    }
  };

  // ✅ Auto-fetch data on mount & refresh every 2 seconds
  useEffect(() => {
    fetchData(selectedDate);
    const intervalId = setInterval(() => fetchData(selectedDate), 2000);

    return () => clearInterval(intervalId);
  }, [selectedDate]);

  // ✅ Prepare data for the graph
  const chartData = {
    labels: pumpScheduleData
      .map((item) => new Date(item.schedule_date).toLocaleString())
      .reverse(),
    datasets: [
      {
        label: 'Duration (minutes)',
        data: pumpScheduleData.map((item) => item.duration_minutes).reverse(),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Pump Schedule Trends',
      },
    },
  };

  // ✅ Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = pumpScheduleData.slice(indexOfFirstItem, indexOfLastItem);

  // ✅ Pagination Controls
  const handleNextPage = () => {
    if (currentPage < Math.ceil(pumpScheduleData.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="pump-schedule-container">
      <Navbar />
      <div className="pump-schedule-content">
        <h1 className="pump-schedule-title">Pump Schedule Data</h1>
        <div className="humidity-container">
          {/* Card Grid */}
          <div className="card-grid">
            {/* Card - PUMP SCHEDULE */}
            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title">WATER PUMP DATA</div>
                <div className="humidity-card-description">
                  {/* You can add any additional content here */}
                </div>
              </div>
            </div>
          </div>
        </div>

        
        {/* ✅ Date Picker */}
        <div className="date-picker-container">
          <label>Select Date: </label>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="yyyy-MM-dd"
            customInput={<button className="date-picker-btn">{selectedDate ? selectedDate.toLocaleDateString() : "Select Date"}</button>}
          />
        </div>

        {/* ✅ Graph */}
        <div className="graph-container" style={{ height: '400px', marginTop: '20px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* ✅ History Modal */}
        <button className="history-button" onClick={() => setIsHistoryModalOpen(true)}>View History</button>

        {isHistoryModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Pump Schedule Logs</h2>
              <button className="close-modal-btn" onClick={() => setIsHistoryModalOpen(false)}>Close</button>

              {/* ✅ History Table */}
              <table className="pump-schedule-table">
                <thead>
                  <tr>
                    <th>Duration (minutes)</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="2">No data available</td>
                    </tr>
                  ) : (
                    currentItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.duration_minutes} minutes</td>
                        <td>{new Date(item.schedule_date).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* ✅ Pagination Controls */}
              <div className="pagination">
                <button onClick={handlePreviousPage} disabled={currentPage === 1}>Previous</button>
                <button onClick={handleNextPage} disabled={currentPage === Math.ceil(pumpScheduleData.length / itemsPerPage)}>Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pesticide;
