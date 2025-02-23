import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom'; // Import zoom plugin
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { supabase } from "./createClient";
import Navbar from './navbar';
import './sensor.css';

// Register Chart.js components + zoom plugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  zoomPlugin // Register zoom plugin
);

const Humidity = () => {
  const [latestData, setLatestData] = useState(null); // State for real-time data (Card Grid)
  const [humidityData, setHumidityData] = useState([]); // State for historical data (Graph & History)
  const [selectedDate, setSelectedDate] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Fetch latest real-time data (only the most recent entry)
  const fetchLatestData = async () => {
    try {
      let { data, error } = await supabase
        .from('humidity')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1); // Get the latest record

      if (error) throw error;
      if (data.length > 0) {
        setLatestData(data[0]); // Store the latest data
      }
    } catch (error) {
      console.error('Error fetching latest humidity data:', error);
    }
  };

  // Fetch historical data based on selected date
  const fetchHistoricalData = async (date) => {
    try {
      let query = supabase
        .from('humidity')
        .select('*')
        .order('timestamp', { ascending: true });

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query
          .gte('timestamp', startOfDay.toISOString())
          .lte('timestamp', endOfDay.toISOString());
      }

      let { data, error } = await query;
      if (error) throw error;

      setHumidityData(data);
    } catch (error) {
      console.error('Error fetching humidity data:', error);
    }
  };

  // Chart Data Preparation
  const chartData = {
    labels: humidityData.map((item) => new Date(item.timestamp)),
    datasets: [
      {
        label: 'Humidity (%)',
        data: humidityData.map((item) => ({
          x: new Date(item.timestamp),
          y: item.humidity,
        })),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
      {
        label: 'Temperature (°C)',
        data: humidityData.map((item) => ({
          x: new Date(item.timestamp),
          y: item.temperature,
        })),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
      },
    ],
  };

  // Chart Options (with Scroll Zoom & Pan)
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: selectedDate ? 'hour' : 'day',
          displayFormats: {
            hour: 'h a',
            day: 'MMM dd',
          },
        },
        ticks: {
          autoSkip: true, // Hide overlapping labels
          maxRotation: 0, // Prevent diagonal text
          minRotation: 0,
        },
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Humidity (%) / Temperature (°C)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Humidity and Temperature Trends',
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
          onZoomComplete({ chart }) {
            // Dynamically adjust X-axis when zooming
            const xScale = chart.scales.x;
            const dataPoints = xScale.ticks.length;

            if (dataPoints > 50) {
              xScale.options.time.unit = 'hour';
            } else if (dataPoints > 10) {
              xScale.options.time.unit = 'day';
            } else {
              xScale.options.time.unit = 'week';
            }

            chart.update('none');
          },
        },
      },
    },
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = humidityData.slice(indexOfFirstItem, indexOfLastItem);

  const nextPage = () => {
    if (currentPage < Math.ceil(humidityData.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const openHistoryModal = () => setIsHistoryModalOpen(true);
  const closeHistoryModal = () => setIsHistoryModalOpen(false);

  useEffect(() => {
    fetchLatestData(); // Fetch latest data for the card grid
    fetchHistoricalData(selectedDate); // Fetch historical data based on date
    const intervalId = setInterval(fetchLatestData, 2000); // Auto-refresh every 2 seconds

    // Subscribe to real-time updates on 'humidity' table
    const humiditySubscription = supabase
      .channel('realtime:humidity') // Create a channel for real-time updates
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'humidity' },
        () => {
          fetchLatestData(); // Refresh data when a new row is added
          fetchHistoricalData(selectedDate); // Refresh historical data
        }
      )
      .subscribe();

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(humiditySubscription); // Cleanup subscription on unmount
    };
  }, [selectedDate]); // Fetch historical data on date change

  return (
    <div className="humidity-container">
      <Navbar />
      <div className="humidity-content">
        <h1 className="humidity-title1">Humidity and Temperature Data</h1>

        <div className="humiditycontainer">
          <div className="card-grid">
            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title">HUMIDITY</div>
                <div className="humidity-card-description">
                  {latestData ? `${latestData.humidity}%` : 'Loading...'}
                </div>
              </div>
            </div>
            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title">TEMPERATURE</div>
                <div className="humidity-card-description">
                  {latestData ? `${latestData.temperature}°C` : 'Loading...'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Date Picker */}
        <div className="date-picker-container">
          <label>Select Date: </label>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="yyyy-MM-dd"
            customInput={<button className="date-picker-btn">{selectedDate ? selectedDate.toLocaleDateString() : "Select Date"}</button>}
          />
        </div>

        {/* Graph */}
        <div className="graph-container" style={{ height: '400px', marginTop: '20px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Button to open history modal */}
        <button className="history-button" onClick={openHistoryModal}>View History</button>

        {/* Modal for history logs */}
        {isHistoryModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>History Logs</h2>
              <button className="close-modal-btn" onClick={closeHistoryModal}>Close</button>

              <table className="humidity-table">
                <thead>
                  <tr>
                    <th>Temperature</th>
                    <th>Humidity</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="3">No data available</td>
                    </tr>
                  ) : (
                    currentItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.temperature}°C</td>
                        <td>{item.humidity}%</td>
                        <td>{new Date(item.timestamp).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="pagination">
              <button onClick={prevPage} disabled={currentPage === 1}>Previous</button>
              <span>Page {currentPage} of {Math.ceil(humidityData.length / itemsPerPage)}</span>
              <button onClick={nextPage} disabled={currentPage === Math.ceil(humidityData.length / itemsPerPage)}>Next</button>
            </div>
            </div>

            {/* Pagination Controls */}
          
          </div>
        )}
      </div>
    </div>
  );
};

export default Humidity;
