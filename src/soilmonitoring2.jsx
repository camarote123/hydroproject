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

const Soilmonitoring2 = () => {
  const [latestSoilData, setLatestSoilData] = useState(null);
  const [soilMoistureData, setSoilMoistureData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const navigate = useNavigate();
  const totalRecordsRef = useRef(0);
  const allDataRef = useRef([]);
  const [loading, setLoading] = useState(false);
  const [latestSoilData3, setLatestSoilData3] = useState(null);

  const fetchLatestSoilMoisture3 = async () => {
    try {
      const { data: soilData, error } = await supabase
        .from('soil_moisture3')  // Fetch from the correct table
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);
  
      if (error) throw error;
  
      if (soilData.length > 0) {
        setLatestSoilData3({
          moisture1: soilData[0].moisture,
          moisture2: soilData[0].moisture2,
          timestamp: new Date(soilData[0].timestamp),
        });
      }
    } catch (error) {
      console.error('Error fetching latest soil moisture data from soil_moisture3:', error);
    }
  };


  const fetchLatestSoilMoisture = async () => {
    try {
      const { data: soilData, error } = await supabase
        .from('soil_moisture4')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (soilData.length > 0) {
        setLatestSoilData({
          moisture3: soilData[0].moisture,
          moisture4: soilData[0].moisture2,
          timestamp: new Date(soilData[0].timestamp)
        });
      }
    } catch (error) {
      console.error('Error fetching latest soil moisture data:', error);
    }
  };

  const fetchHistoricalData = async (date, from = 0, to = 1000) => {
    setLoading(true);
    try {
      let query = supabase
        .from('soil_moisture4')
        .select('*', { count: 'exact' })
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

      // Convert timestamps to UTC+8
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
      totalRecordsRef.current = count || 0;

    } catch (error) {
      console.error('Error fetching soil moisture data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchLatestSoilMoisture();
      await fetchHistoricalData(selectedDate);
    };

    fetchData();

    // Set up real-time subscriptions for soil_moisture4 table
    const soilMoistureSubscription = supabase
      .channel('realtime:soil_moisture4')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'soil_moisture4' },
        (payload) => {
          const newRecord = {
            ...payload.new,
            timestamp: new Date(new Date(payload.new.timestamp).getTime() + 8 * 60 * 60 * 1000),
          };
          setSoilMoistureData((prevData) => [...prevData, newRecord]);
          allDataRef.current = [...allDataRef.current, newRecord];
          fetchLatestSoilMoisture();
        }
      )
      .subscribe();

    // Data refresh interval (every 2000ms)
    return () => {
      supabase.removeChannel(soilMoistureSubscription);
    };
  }, [selectedDate]);


  useEffect(() => {
    const fetchData = async () => {
      await fetchLatestSoilMoisture();
      await fetchLatestSoilMoisture3(); // Fetch soil_moisture3 data
      await fetchHistoricalData(selectedDate);
    };
  
    fetchData();
  
    // Set up real-time updates
    const soilMoistureSubscription3 = supabase
      .channel('realtime:soil_moisture3')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'soil_moisture3' },
        (payload) => {
          const newRecord = {
            ...payload.new,
            timestamp: new Date(new Date(payload.new.timestamp).getTime() + 8 * 60 * 60 * 1000),
          };
          setLatestSoilData3({
            moisture1: newRecord.moisture,
            moisture2: newRecord.moisture2,
            timestamp: newRecord.timestamp,
          });
        }
      )
      .subscribe();
  
      return () => {
        supabase.removeChannel(soilMoistureSubscription3);
      };
    }, [selectedDate]);

  const paginatedData = soilMoistureData.slice(
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

  const chartData = {
    labels: soilMoistureData.map(item => new Date(item.timestamp)),
    datasets: [
      {
        label: 'Soil Moisture 3 (%)',
        data: soilMoistureData.map(item => ({
          x: new Date(item.timestamp),
          y: item.moisture,
        })),
        borderColor: 'rgba(214, 166, 7, 0.81)',
        backgroundColor: 'rgba(214, 166, 7, 0.81)',
        fill: true,
        pointRadius: 0,
        tension: 0.1,
      },
      {
        label: 'Soil Moisture 4 (%)',
        data: soilMoistureData.map(item => ({
          x: new Date(item.timestamp),
          y: item.moisture2,
        })),
        borderColor: 'rgba(19, 104, 19, 0.94)',
        backgroundColor: 'rgba(19, 104, 19, 0.94)',
        fill: true,
        pointRadius: 0,
        tension: 0.1,
      },
    ],
  };

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
        title: { display: true, text: 'Moisture (%)' },
      },
    },
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Soil Moisture Trends' },
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

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="main-content">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button className="tab-button" onClick={() => navigate('/soilmonitoring')}>Soil Moisture 1-2</button>
          <button className="tab-button active">Soil Moisture 3-4</button>
          <button className="tab-button" onClick={() => navigate('/npk')}>NPK Levels</button>
          <button className="tab-button" onClick={() => navigate('/pesticide')}>Pesticide</button>
        </div>
        <h3 className='title'>
          Soil Moisture 3-4
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

            {/* Chart legend */}
            <br></br>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: 'rgba(214, 166, 7, 0.81)' }}></div>
                <div className="legend-label">Soil Moisture 3 (%)</div>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: 'rgba(19, 104, 19, 0.94)' }}></div>
                <div className="legend-label">Soil Moisture 4 (%)</div>
              </div>
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

            <div className="status-card soil-moisture-3">
              <div className="card-label">Soil Moisture 1</div>
              <div className="card-value">{latestSoilData3 ? `${latestSoilData3.moisture1}%` : 'Loading...'}</div>
            </div>

            <div className="status-card soil-moisture-3">
              <div className="card-label">Soil Moisture 2</div>
              <div className="card-value">{latestSoilData3 ? `${latestSoilData3.moisture2}%` : 'Loading...'}</div>
            </div>
            
            <div className="status-card soil-moisture-3">
              <div className="card-label">Soil Moisture 3</div>
              <div className="card-value">{latestSoilData ? `${latestSoilData.moisture3}%` : 'Loading...'}</div>
            </div>
            
            <div className="status-card soil-moisture-4">
              <div className="card-label">Soil Moisture 4</div>
              <div className="card-value">{latestSoilData ? `${latestSoilData.moisture4}%` : 'Loading...'}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content1">
            <h2>Soil Moisture Logs</h2>
            <button className="modal-close" onClick={() => setIsHistoryModalOpen(false)}>&times;</button>
            
            <div className="table-container">
              <table className="temperature-table">
                <thead>
                  <tr>
                    <th>Moisture 3</th>
                    <th>Moisture 4</th>
                    <th>Water Pump Status</th>
                    <th>Water Pump 2 Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.moisture !== null ? `${item.moisture}%` : '-'}</td>
                      <td>{item.moisture2 !== null ? `${item.moisture2}%` : '-'}</td>
                      <td>{item.water_pump ? 'On' : 'Off'}</td>
                      <td>{item.water_pump2 ? 'On' : 'Off'}</td>
                      <td>{new Date(item.timestamp).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</td>
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

export default Soilmonitoring2;