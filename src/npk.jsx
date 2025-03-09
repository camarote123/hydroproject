import { createClient } from '@supabase/supabase-js';
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
import React, { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from 'react-router-dom';
import Navbar from './navbar';
import './sensor.css';

// Initialize Supabase client
const supabaseUrl = 'https://blxxjmoszhndbfgqrprb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJseHhqbW9zemhuZGJmZ3FycHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwMzkyMjEsImV4cCI6MjA0NzYxNTIyMX0._WjnfmgLYBaJP6g64fiCM__a7JWbXPDaZBK_j2yIvV8';
const supabase = createClient(supabaseUrl, supabaseKey);


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

const Npk = () => {
  const [latestData, setLatestData] = useState(null);
  const [npkData, setNPKData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16; // Number of records per page
  const navigate = useNavigate();
  const totalRecordsRef = useRef(0);
  const allDataRef = useRef([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch Latest Data for Card Grid
  const fetchLatestData = async () => {
    try {
      let { data, error } = await supabase
        .from('npk')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data.length > 0) {
        setLatestData(data[0]);
      }
    } catch (error) {
      console.error('Error fetching latest NPK data:', error);
    }
  };

  // ✅ Fetch Historical Data
  const fetchHistoricalData = async (date, from = 0, to = 1000) => {
    setLoading(true);
    try {
      let query = supabase
        .from('npk')
        .select('*', { count: 'exact' }) // ✅ Ensure count is retrieved
        .order('timestamp', { ascending: true })
        .range(from, to);

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query.gte('timestamp', startOfDay.toISOString()).lte('timestamp', endOfDay.toISOString());
      }

      let { data, error, count } = await query;
      if (error) throw error;

      // ✅ Convert timestamps to UTC+8
      const adjustedData = data.map(item => ({
        ...item,
        timestamp: new Date(new Date(item.timestamp).getTime() + 8 * 60 * 60 * 1000),
      }));

      if (from === 0) {
        setNPKData(adjustedData);
      } else {
        setNPKData(prevData => [...prevData, ...adjustedData]);
      }

      allDataRef.current = [...allDataRef.current, ...adjustedData];
      if (count !== null) totalRecordsRef.current = count; // ✅ Ensure count is updated

    } catch (error) {
      console.error('Error fetching NPK data:', error);
    }
    setLoading(false);
  };

  // ✅ Paginate Data
  const paginatedData = npkData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ✅ Pagination Controls
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = async () => {
    if ((currentPage * itemsPerPage) < totalRecordsRef.current) {
      const newPage = currentPage + 1;
      await fetchHistoricalData(selectedDate, (newPage - 1) * itemsPerPage, newPage * itemsPerPage);
      setCurrentPage(newPage);
    }
  };

  // ✅ Chart Data
  const chartData = {
    labels: npkData.map(item => new Date(item.timestamp)), // Already adjusted in fetchHistoricalData
    datasets: [
      {
        label: 'Nitrogen (N)',
        data: npkData.map(item => ({
          x: new Date(item.timestamp),
          y: item.nitrogen,
        })),
        borderColor: 'rgba(214, 166, 7, 0.81)',
        backgroundColor: 'rgba(214, 166, 7, 0.81)',
        fill: true,
        pointRadius: 0, // Remove dots on the graph
      },
      {
        label: 'Phosphorus (P)',
        data: npkData.map(item => ({
          x: new Date(item.timestamp),
          y: item.phosphorus,
        })),
        borderColor: 'rgb(38, 226, 79)',
        backgroundColor: 'rgb(38, 226, 79)',
        fill: true,
        pointRadius: 0, // Remove dots on the graph
      },
      {
        label: 'Potassium (K)',
        data: npkData.map(item => ({
          x: new Date(item.timestamp),
          y: item.potassium,
        })),
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        fill: true,
        pointRadius: 0, // Remove dots on the graph
      },
    ],
  };

  // ✅ Chart Options (with Scroll Zoom & Pan)
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
          text: 'NPK Levels',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'NPK Levels Trends',
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
            // 🔥 Dynamically adjust X-axis when zooming
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

  useEffect(() => {
    const fetchData = async () => {
      await fetchLatestData();
      await fetchHistoricalData(selectedDate);
    };
  
    fetchData(); // Initial fetch
  
    // Subscribe to changes in the 'npk' table
    const npkSubscription = supabase
      .channel('realtime:npk') // Create a channel for real-time updates
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'npk' }, 
        (payload) => {
          const newRecord = {
            ...payload.new,
            timestamp: new Date(new Date(payload.new.timestamp).getTime() + 8 * 60 * 60 * 1000), // UTC+8 conversion
          };
          setNPKData((prevData) => [...prevData, newRecord]); // Append new record
          allDataRef.current = [...allDataRef.current, newRecord];
          setLatestData(newRecord); // Update latest data
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(npkSubscription); // Cleanup subscription on unmount
    };
  }, [selectedDate]);
  

  return (
    <div className="humidity-container">
      <Navbar />
      <div className="humidity-content">
        <h1 className="humidity-title">NPK Data</h1>

        {/* Card Grid (Latest Data) */}
        <div className="humiditycontainer">
          <div className="card-grid">
            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title">NITROGEN (N)</div>
                <div className="humidity-card-description">
                  {latestData ? `${latestData.nitrogen}` : 'Loading...'}
                </div>
              </div>
            </div>
            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title">PHOSPHORUS (P)</div>
                <div className="humidity-card-description">
                  {latestData ? `${latestData.phosphorus}` : 'Loading...'}
                </div>
              </div>
            </div>
            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title">POTASSIUM (K)</div>
                <div className="humidity-card-description">
                  {latestData ? `${latestData.potassium}` : 'Loading...'}
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
            isClearable
            customInput={ // 🔥 Custom button instead of input box
              <button className="date-picker-btn">
                {selectedDate ? selectedDate.toLocaleDateString() : "Select a Date"}
              </button>
            }
          />
        </div>

        {/* Graph with Scroll Zoom & Pan */}
        <div className="graph-container" style={{ height: '400px', marginTop: '20px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Button to open the history modal */}
        <button className="history-button" onClick={() => setIsHistoryModalOpen(true)}>View History</button>

        <div>
          <br></br>
          <button onClick={() => navigate('/pesticide')}>BACK</button>
        </div>

        {/* Modal for displaying history logs */}
        {isHistoryModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>History Logs</h2>
              <button className="close-modal-btn" onClick={() => setIsHistoryModalOpen(false)}>Close</button>
              <table className="soil-moisture-table">
                <thead>
                  <tr>
                    <th>Nitrogen (N)</th>
                    <th>Phosphorus (P)</th>
                    <th>Potassium (K)</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.nitrogen}</td>
                      <td>{item.phosphorus}</td>
                      <td>{item.potassium}</td>
                      <td>{new Date(item.timestamp).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="pagination">
                <button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</button>
                <span>Page {currentPage}</span>
                <button onClick={handleNextPage} enabled={(currentPage * itemsPerPage) >= totalRecordsRef.current}>Next</button>
                {loading && <span>Loading...</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Npk;