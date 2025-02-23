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
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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
  zoomPlugin
);

const Hydrowaterlevel = () => {
  const [waterLevelData, setWaterLevelData] = useState([]);
  const [latestWaterLevel, setLatestWaterLevel] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Fetch Latest Water Level
  const fetchLatestWaterLevel = async () => {
    try {
      const { data, error } = await supabase
        .from('water_levels')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data.length > 0) {
        setLatestWaterLevel(data[0]);
      }
    } catch (error) {
      console.error('Error fetching latest water level:', error);
    }
  };

  // ✅ Fetch Historical Data
  const fetchHistoricalData = async (date) => {
    try {
      let query = supabase.from('water_levels').select('*').order('created_at', { ascending: true });

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query.gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString());
      }

      let { data, error } = await query;
      if (error) throw error;
      setWaterLevelData(data);
    } catch (error) {
      console.error('Error fetching water level data:', error);
    }
  };

  // ✅ Chart Data
  const chartData = {
    labels: waterLevelData.map((item) => new Date(item.created_at)),
    datasets: [
      {
        label: 'Water Level (%)',
        data: waterLevelData.map((item) => ({
          x: new Date(item.created_at),
          y: item.water_level,
        })),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
      },
    ],
  };

  // ✅ Chart Options with Zoom & Pan
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
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Water Level (%)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Water Level Trends',
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
        },
      },
    },
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchLatestWaterLevel();
      await fetchHistoricalData(selectedDate);
    };

    fetchData();

    // ✅ Subscribe to real-time changes in 'water_levels'
    const waterLevelSubscription = supabase
      .channel('realtime:water_levels')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'water_levels' },
        (payload) => {
          console.log('New Water Level data:', payload.new);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(waterLevelSubscription);
    };
  }, [selectedDate]);

  // ✅ Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = waterLevelData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(waterLevelData.length / itemsPerPage);

  return (
    <div className="water-level-container">
      <Navbar />
      <div className="water-level-content">
        <h1 className="water-level-title">Water Level Data</h1>

        {/* Card Section */}
        <div className="card-grid">
          <div className="humidity-card">
            <div className="humidity-card-content">
              <div className="humidity-card-title">WATER LEVEL</div>
              <div className="humidity-card-description">
                {latestWaterLevel ? `${latestWaterLevel.water_level}%` : 'Loading...'}
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
            customInput={<button className="date-picker-btn">{selectedDate ? selectedDate.toLocaleDateString() : "Select Date"}</button>}
          />
        </div>

        {/* Graph */}
        <div className="graph-container" style={{ height: '400px', marginTop: '20px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* History Modal */}
        <button className="history-button" onClick={() => setIsHistoryModalOpen(true)}>View History</button>

        {isHistoryModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>History Logs</h2>
              <button className="close-modal-btn" onClick={() => setIsHistoryModalOpen(false)}>Close</button>

              <table className="water-level-table">
                <thead>
                  <tr>
                    <th>Water Level (%)</th>
                    <th>Pump Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.water_level}%</td>
                      <td>{item.pump_status}</td>
                      <td>{new Date(item.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="pagination-controls">
                <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage((prev) => (indexOfLastItem < waterLevelData.length ? prev + 1 : prev))} disabled={indexOfLastItem >= waterLevelData.length}>
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hydrowaterlevel;
