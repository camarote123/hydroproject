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
import zoomPlugin from 'chartjs-plugin-zoom';
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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  zoomPlugin
);

const Pesticide = () => {
  const [latestData, setLatestData] = useState(null);
  const [pesticideData, setPesticideData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const navigate = useNavigate();
  const totalRecordsRef = useRef(0);
  const allDataRef = useRef([]);
  const [loading, setLoading] = useState(false);

  // Fetch Latest Data for Card Grid
  const fetchLatestData = async () => {
    try {
      let { data, error } = await supabase
        .from('pesticide_distance')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data.length > 0) {
        setLatestData(data[0]);
      }
    } catch (error) {
      console.error('Error fetching latest pesticide distance data:', error);
    }
  };

  // Fetch Historical Data
  const fetchHistoricalData = async (date, from = 0, to = 1000) => {
    setLoading(true);
    try {
      let query = supabase
        .from('pesticide_distance')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: true })
        .range(from, to);

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query.gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString());
      }

      let { data, error, count } = await query;
      if (error) throw error;

      // Convert timestamps to UTC+8
      const adjustedData = data.map(item => ({
        ...item,
        created_at: new Date(new Date(item.created_at).getTime() + 8 * 60 * 60 * 1000),
      }));

      if (from === 0) {
        setPesticideData(adjustedData);
      } else {
        setPesticideData(prevData => [...prevData, ...adjustedData]);
      }

      allDataRef.current = [...allDataRef.current, ...adjustedData];
      totalRecordsRef.current = count || 0;
    } catch (error) {
      console.error('Error fetching pesticide distance data:', error);
    }
    setLoading(false);
  };

  // Pagination Controls
  const paginatedData = pesticideData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  // Chart Data
  const chartData = {
    labels: pesticideData.map(item => new Date(item.created_at)),
    datasets: [
      {
        label: 'Distance',
        data: pesticideData.map(item => ({
          x: new Date(item.created_at),
          y: item.distance,
        })),
        borderColor: 'rgba(19, 104, 19, 0.94)',
        backgroundColor: 'rgba(19, 104, 19, 0.2)',
        fill: true,
        pointRadius: 0,
        tension: 0.1,
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
          autoSkip: true,
          maxRotation: 0,
          minRotation: 0,
        },
        title: { display: true, text: 'Time' },
      },
      y: {
        title: { display: true, text: 'Distance' },
      },
    },
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Pesticide Distance Trends' },
      decimation: {
        enabled: true,
        algorithm: 'lttb',
        samples: 500,
      },
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
          onZoomComplete({ chart }) {
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

    fetchData();

    // Subscribe to changes in the 'pesticide_distance' table
    const pesticideSubscription = supabase
      .channel('realtime:pesticide_distance')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pesticide_distance' },
        (payload) => {
          const newRecord = {
            ...payload.new,
            created_at: new Date(new Date(payload.new.created_at).getTime() + 8 * 60 * 60 * 1000),
          };
          setPesticideData((prevData) => [...prevData, newRecord]);
          allDataRef.current = [...allDataRef.current, newRecord];
          fetchLatestData();
        }
      )
      .subscribe();

    // Data refresh interval
    const intervalId = setInterval(() => {
      fetchLatestData();
    }, 2000);

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(pesticideSubscription);
    };
  }, [selectedDate]);

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="main-content">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button className="tab-button" onClick={() => navigate('/soilmonitoring')}>Soil Moisture 1-2</button>
          <button className="tab-button" onClick={() => navigate('/soilmonitoring2')}>Soil Moisture 3-4</button>
          <button className="tab-button" onClick={() => navigate('/npk')}>NPK Levels</button>
          <button className="tab-button active">Pesticide</button>
        </div>
        <h3 className='title'>
          Pesticide Distance Data
        </h3>

        <div className="dashboard-content">
          {/* Left Column - Chart */}
          <div className="chart-column">
            {/* Date picker */}
            <div className="date-picker-container">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="yyyy-MM-dd"
                isClearable
                customInput={<button className="date-picker-btn">{selectedDate ? selectedDate.toLocaleDateString() : "Select a Date"}</button>}
              />
            </div>

            {/* Chart */}
            <div className="chart-container">
              <Line data={chartData} options={chartOptions} />
            </div>
            
            {/* History section */}
            <div className="history-section">
              <button className="select-date-btn" onClick={() => setIsHistoryModalOpen(true)}>
                Logs <span className="dropdown-arrow">▼</span>
              </button>
            </div>
          </div>
          
          {/* Right Column - Status Cards */}
          <div className="status-column">
            <h2 className="status-title">Current Status</h2>
            
            <div className="status-card distance">
              <div className="card-label">Distance</div>
              <div className="card-value">{latestData ? `${latestData.distance}` : 'Loading...'}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content1">
            <h2>Pesticide Distance Logs</h2>
            <button className="modal-close" onClick={() => setIsHistoryModalOpen(false)}>&times;</button>
            
            <div className="table-container">
              <table className="temperature-table">
                <thead>
                  <tr>
                    <th>Distance</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.distance}</td>
                      <td>{new Date(item.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</button>
              <span>Page {currentPage}</span>
              <button onClick={handleNextPage} disabled={(currentPage * itemsPerPage) >= totalRecordsRef.current}>Next</button>
              {loading && <span>Loading...</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pesticide;