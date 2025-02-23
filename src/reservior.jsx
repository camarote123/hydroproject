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
import "react-datepicker/dist/react-datepicker.css";
import { supabase } from './createClient';
import Navbar from './navbar';
import './sensor.css';

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

const Reservior = () => {
  const [latestWaterData, setLatestWaterData] = useState(null);
  const [waterData, setWaterData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of logs per page

  // ✅ Fetch Latest Water Distance for Card
  const fetchLatestWaterData = async () => {
    try {
      let { data, error } = await supabase
        .from('water_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data.length > 0) {
        setLatestWaterData(data[0]);
      }
    } catch (error) {
      console.error('Error fetching latest water data:', error);
    }
  };

  // ✅ Fetch Historical Data
  const fetchHistoricalData = async (date) => {
    try {
      let query = supabase.from('water_data').select('*').order('timestamp', { ascending: true });

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query.gte('timestamp', startOfDay.toISOString()).lte('timestamp', endOfDay.toISOString());
      }

      let { data, error } = await query;
      if (error) throw error;
      setWaterData(data);
      setCurrentPage(1); // Reset to first page when new data is fetched
    } catch (error) {
      console.error('Error fetching water data:', error);
    }
  };

  // ✅ Chart Data
  const chartData = {
    labels: waterData.map(item => new Date(item.timestamp)),
    datasets: [
      {
        label: 'Water Distance (cm)',
        data: waterData.map(item => ({
          x: new Date(item.timestamp),
          y: item.distance,
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
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Water Distance (cm)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Water Distance Trends',
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
      await fetchLatestWaterData();
      await fetchHistoricalData(selectedDate);
    };

    fetchData();

    // ✅ Subscribe to real-time changes
    const waterSubscription = supabase
      .channel('realtime:water_data')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'water_data' },
        (payload) => {
          console.log('New water data:', payload.new);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(waterSubscription);
    };
  }, [selectedDate]);

  // ✅ Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = waterData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(waterData.length / itemsPerPage);

  return (
    <div className="water-data-container">
      <Navbar />
      <div className="water-data-content">
        <h1 className="water-data-title">Water Distance Data</h1>

        {/* ✅ Card Grid (Latest Data) */}
        <div className="humidity-container">
          <div className="card-grid">
            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title">WATER DISTANCE</div>
                <div className="humidity-card-description">
                  {latestWaterData ? `${latestWaterData.distance} cm` : 'Loading...'}
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
            isClearable
            customInput={<button className="date-picker-btn">{selectedDate ? selectedDate.toLocaleDateString() : "Select a Date"}</button>}
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
              <h2>Water Distance Logs</h2>
              <button className="close-modal-btn" onClick={() => setIsHistoryModalOpen(false)}>Close</button>

              <table className="water-data-table">
                <thead>
                  <tr>
                    <th>Distance (cm)</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.distance} cm</td>
                      <td>{new Date(item.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ✅ Pagination Controls */}
              <div className="pagination-controls">
                <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage((prev) => (indexOfLastItem < waterData.length ? prev + 1 : prev))} disabled={indexOfLastItem >= waterData.length}>
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

export default Reservior;
