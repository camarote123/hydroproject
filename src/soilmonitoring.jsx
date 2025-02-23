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
import { supabase } from './createClient';
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

const Soilmonitoring = () => {
  const [latestData, setLatestData] = useState(null);
  const [soilMoistureData, setSoilMoistureData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10; // Number of records per page

  // ✅ Fetch Latest Data for Card Grid
  const fetchLatestData = async () => {
    try {
      let { data, error } = await supabase
        .from('soil_moisture')
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
  const fetchHistoricalData = async (date) => {
    try {
      let query = supabase.from('soil_moisture').select('*').order('timestamp', { ascending: true });

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query.gte('timestamp', startOfDay.toISOString()).lte('timestamp', endOfDay.toISOString());
      }

      let { data, error } = await query;
      if (error) throw error;
      setSoilMoistureData(data);
    } catch (error) {
      console.error('Error fetching soil moisture data:', error);
    }
  };

  // ✅ Chart Data
  const chartData = {
    labels: soilMoistureData.map(item => new Date(item.timestamp)),
    datasets: [
      {
        label: 'Soil Moisture (%)',
        data: soilMoistureData.map(item => ({
          x: new Date(item.timestamp),
          y: item.moisture,
        })),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
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

  const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentItems = soilMoistureData.slice(indexOfFirstItem, indexOfLastItem);


const nextPage = () => {
  if (currentPage < Math.ceil(soilMoistureData.length / itemsPerPage)) {
    setCurrentPage(currentPage + 1);
  }
};

const prevPage = () => {
  if (currentPage > 1) {
    setCurrentPage(currentPage - 1);
  }
};


  useEffect(() => {
    const fetchData = async () => {
      await fetchLatestData();
      await fetchHistoricalData(selectedDate);
    };
  
    fetchData(); // Initial fetch
  
    // Subscribe to changes in the 'soil_moisture' table
    const soilMoistureSubscription = supabase
      .channel('realtime:soil_moisture') // Create a channel for real-time updates
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'soil_moisture' }, 
        (payload) => {
          console.log('New data inserted:', payload.new);
          fetchData(); // Refresh data when a new row is added
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(soilMoistureSubscription); // Cleanup subscription on unmount
    };
  }, [selectedDate]);
  

  return (
    <div className="soil-moisture-container">
      <Navbar />
      <div className="soil-moisture-content">
        <h1 className="soil-moisture-title">Soil Moisture Data</h1>

        {/* Card Grid (Latest Data) */}
        <div className="humidity-container">
          <div className="card-grid">
            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title">SOIL MOISTURE</div>
                <div className="humidity-card-description">
                  {latestData ? `${latestData.moisture}%` : 'Loading...'}
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

        {/* Modal for displaying history logs */}
        {isHistoryModalOpen && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>History Logs</h2>
      <button className="close-modal-btn" onClick={() => setIsHistoryModalOpen(false)}>Close</button>
      <table className="soil-moisture-table">
        <thead>
          <tr>
            <th>Moisture (%)</th>
            <th>Water Pump Status</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((item) => (
            <tr key={item.id}>
              <td>{item.moisture}%</td>
              <td>{item.water_pump ? 'On' : 'Off'}</td>
              <td>{new Date(item.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="pagination">
        <button onClick={prevPage} disabled={currentPage === 1}>Previous</button>
        <span>Page {currentPage} of {Math.ceil(soilMoistureData.length / itemsPerPage)}</span>
        <button onClick={nextPage} disabled={currentPage >= Math.ceil(soilMoistureData.length / itemsPerPage)}>Next</button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default Soilmonitoring;
