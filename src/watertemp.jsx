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

const Watertemp = () => {
  const [latestTemperature, setLatestTemperature] = useState(null);
  const [temperatureData, setTemperatureData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const navigate = useNavigate();
  const totalRecordsRef = useRef(0);
  const allDataRef = useRef([]);
  const [loading, setLoading] = useState(false);

  // Sensor data states
  const [doData, setDoData] = useState([]);
  const [waterLevelData, setWaterLevelData] = useState([]);
  const [feederData, setFeederData] = useState([]);
  const [phlevelData, setPhlevel] = useState([]);
  const [waterData, setWaterData] = useState([]);

  const fetchLatestTemperature = async () => {
    try {
      let { data, error } = await supabase
        .from('temperature_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data.length > 0) {
        setLatestTemperature(data[0]);
      }
    } catch (error) {
      console.error('Error fetching latest temperature:', error);
    }
  };

  const fetchHistoricalData = async (date, from = 0, to = 1000) => {
    setLoading(true);
    try {
      let query = supabase
        .from('temperature_data')
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
  
      const adjustedData = data.map(item => ({
        ...item,
        created_at: new Date(new Date(item.created_at).getTime() + 8 * 60 * 60 * 1000),
      }));
  
      if (from === 0) {
        setTemperatureData(adjustedData);
      } else {
        setTemperatureData(prevData => [...prevData, ...adjustedData]);
      }
  
      allDataRef.current = [...allDataRef.current, ...adjustedData];
      if (count !== null) totalRecordsRef.current = count;
  
    } catch (error) {
      console.error('Error fetching temperature data:', error);
    }
    setLoading(false);
  };

  // Combined function to fetch all sensor data
  const fetchAllSensorData = async () => {
    try {
      // Dissolved Oxygen
      const { data: doResult, error: doError } = await supabase
        .from('dissolved_oxygen')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      if (doError) throw doError;
      if (doResult.length > 0) setDoData(doResult);

      // Water Level
      const { data: waterLevelResult, error: waterLevelError } = await supabase
        .from('water_levels')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      if (waterLevelError) throw waterLevelError;
      if (waterLevelResult.length > 0) setWaterLevelData(waterLevelResult);

      // Feeder
      const { data: feederResult, error: feederError } = await supabase
        .from('feeder1')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      if (feederError) throw feederError;
      if (feederResult.length > 0) setFeederData(feederResult);

      // pH Level
      const { data: phResult, error: phError } = await supabase
        .from('ph_level')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      if (phError) throw phError;
      if (phResult.length > 0) setPhlevel(phResult);

      // Water Data
      const { data: waterResult, error: waterError } = await supabase
        .from('water_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);
      if (waterError) throw waterError;
      if (waterResult.length > 0) setWaterData(waterResult);

    } catch (error) {
      console.error('Error fetching sensor data:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchLatestTemperature();
      await fetchHistoricalData(selectedDate);
      await fetchAllSensorData();
    };

    
    fetchData();

    const temperatureSubscription = supabase
      .channel('realtime:temperature_data')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'temperature_data' },
        (payload) => {
          const newRecord = {
            ...payload.new,
            created_at: new Date(new Date(payload.new.created_at).getTime() + 8 * 60 * 60 * 1000),
          };
          setTemperatureData((prevData) => [...prevData, newRecord]);
          allDataRef.current = [...allDataRef.current, newRecord];
          setLatestTemperature(newRecord);
        }
      )
      .subscribe();

       // Data refresh interval (every 2000ms)
    const intervalId = setInterval(() => {
      fetchLatestTemperature();
    }, 2000);

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(temperatureSubscription);
    };
  }, [selectedDate]);


  const paginatedData = temperatureData.slice(
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
    labels: temperatureData.map(item => new Date(item.created_at)),
    datasets: [
      {
        label: 'Water Temperature (°C)',
        data: temperatureData.map(item => ({
          x: new Date(item.created_at),
          y: item.temperature,
        })),
        borderColor: 'rgb(7, 126, 196)',
        backgroundColor: 'rgb(7, 126, 196)',
        fill: false,
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
        title: { display: true, text: ' °C' },
      },
    },
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Water Temperature Trends' },
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
          <button className="tab-button active">Water Temperature</button>
          <button className="tab-button" onClick={() => navigate('/do')}>Dissolved Oxygen</button>
          <button className="tab-button" onClick={() => navigate('/hydrowaterlevel')}>Pond Water Level</button>
          <button className="tab-button" onClick={() => navigate('/reservior')}>Reservoir</button>
          <button className="tab-button" onClick={() => navigate('/ph_level')}>pH Level</button>
          <button className="tab-button" onClick={() => navigate('/food')}>Food</button>
        </div>
        <h3 className='title'>
          Water Temperature
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

            {/* Chart title */}
  <br></br>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: 'rgb(7, 126, 196)' }}></div>
                <div className="legend-label">Water Temperature (°C)</div>
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
            
            <div className="status-card water-temp">
              <div className="card-label">Water Temperature</div>
              <div className="card-value">{latestTemperature ? `${latestTemperature.temperature.toFixed(2)}°C` : 'Loading...'}</div>
            </div>
            
            <div className="status-card dissolved-oxygen">
              <div className="card-label">Dissolve Oxygen</div>
              <div className="card-value">{doData.length > 0 ? `${doData[0].do_level.toFixed(2)} mg/L` : 'Loading...'}</div>
            </div>
            
            <div className="status-card pond-level">
              <div className="card-label">Reservoir Water Level</div>
              <div className="card-value">{waterData.length > 0 ? `${waterData[0].distance} cm` : 'Loading...'}</div>
            </div>
            
            <div className="status-card ph-level">
              <div className="card-label">pH Level</div>
              <div className="card-value">{phlevelData.length > 0 ? `pH:${phlevelData[0].ph_level.toFixed(2)}` : 'Loading...'}</div>
            </div>
            
            <div className="status-card reservoir">
              <div className="card-label">Pond Water Level</div>
              <div className="card-value">{waterLevelData.length > 0 ? `${waterLevelData[0].water_level}%` : 'Loading...'}</div>
            </div>
            
            <div className="status-card fish-feed">
              <div className="card-label">Fish Food Distance</div>
              <div className="card-value">{feederData.length > 0 ? `${feederData[0].distance.toFixed(3)} cm` : 'Loading...'}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content1">
            <h2>Temperature Logs</h2>
            <button className="modal-close" onClick={() => setIsHistoryModalOpen(false)}>&times;</button>
            
            <div className="table-container">
              <table className="temperature-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.temperature.toFixed(2)}°C</td>
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

export default Watertemp; 