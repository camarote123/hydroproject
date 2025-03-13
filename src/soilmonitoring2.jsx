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

const Soilmonitoring2 = () => {
  const [latestData, setLatestData] = useState(null);
  const [soilMoistureData, setSoilMoistureData] = useState([]);
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
        .from('soil_moisture4')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data.length > 0) {
        setLatestData(data[0]);
      }
    } catch (error) {
      console.error('Error fetching latest soil moisture data:', error);
    }
  };

  // ✅ Fetch Historical Data
  const fetchHistoricalData = async (date, from = 0, to = 1000) => {
    setLoading(true);
    try {
      let query = supabase
        .from('soil_moisture4')
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
        setSoilMoistureData(adjustedData);
      } else {
        setSoilMoistureData(prevData => [...prevData, ...adjustedData]);
      }

      allDataRef.current = [...allDataRef.current, ...adjustedData];
      if (count !== null) totalRecordsRef.current = count; // ✅ Ensure count is updated

    } catch (error) {
      console.error('Error fetching soil moisture data:', error);
    }
    setLoading(false);
  };

  // ✅ Paginate Data
  const paginatedData = soilMoistureData.slice(
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
    labels: soilMoistureData.map(item => new Date(item.timestamp)), // Already adjusted in fetchHistoricalData
    datasets: [
      {
        label: 'Soil Moisture (%)',
        data: soilMoistureData.map(item => ({
          x: new Date(item.timestamp),
          y: item.moisture,
        })),
        borderColor: 'rgba(19, 104, 19, 0.94)',
        backgroundColor: 'rgba(19, 104, 19, 0.94)',
        fill: true,
        pointRadius: 0, // Remove dots on the graph
      },
      {
        label: 'Soil Moisture 2 (%)',
        data: soilMoistureData.map(item => ({
          x: new Date(item.timestamp),
          y: item.moisture2,
        })),
        borderColor: 'rgba(214, 166, 7, 0.81)',
        backgroundColor: 'rgba(214, 166, 7, 0.81)',
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
          text: 'Soil Moisture (%)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Soil Moisture Trends',
      },
      decimation: {
        enabled: true,
        algorithm: 'lttb', // Use the Largest Triangle Three Buckets algorithm for smooth data
        samples: 500, // Reduce to 500 points
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

    // Subscribe to changes in the 'soil_moisture4' table
    const soilMoistureSubscription = supabase
      .channel('realtime:soil_moisture4')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'soil_moisture4' },
        (payload) => {
          const newRecord = {
            ...payload.new,
            timestamp: new Date(new Date(payload.new.timestamp).getTime() + 8 * 60 * 60 * 1000), // UTC+8 conversion
          };
          setSoilMoistureData((prevData) => [...prevData, newRecord]); // Append new record
          allDataRef.current = [...allDataRef.current, newRecord];
          setLatestData(newRecord); // Update latest data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(soilMoistureSubscription); // Cleanup subscription on unmount
    };
  }, [selectedDate]);

  return (
    <div className="humidity-container">
      <Navbar />
      <div className="humidity-content">
        <h1 className="humidity-title">Soil Moisture Data</h1>

        {/* Card Grid (Latest Data) */}
        <div className="humiditycontainer">
          <div className="card-grid">
            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title">SOIL MOISTURE 3</div>
                <div className="humidity-card-description">
                  {latestData ? `${latestData.moisture}%` : 'Loading...'}
                </div>
              </div>
            </div>
            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title">SOIL MOISTURE 4</div>
                <div className="humidity-card-description">
                  {latestData ? `${latestData.moisture2}%` : 'Loading...'}
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
          <button onClick={() => navigate('/soilmonitoring')}>BACK</button>
          <button onClick={() => navigate('/pesticide')}> NEXT</button>
        </div>

        {/* Modal for displaying history logs */}
        {isHistoryModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>History Logs</h2>
              <button className="modal-close" onClick={() => setIsHistoryModalOpen(false)}>&times;</button>
              <table className="soil-moisture-table">
                <thead>
                  <tr>
                    <th>Moisture (%)</th>
                    <th>Moisture 2 (%)</th>
                    <th>Water Pump Status</th>
                    <th>Water Pump 2 Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.moisture}%</td>
                      <td>{item.moisture2}%</td>
                      <td>{item.water_pump ? 'On' : 'Off'}</td>
                      <td>{item.water_pump2 ? 'On' : 'Off'}</td>
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

export default Soilmonitoring2;