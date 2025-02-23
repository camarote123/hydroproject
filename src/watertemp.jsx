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

const Watertemp = () => {
  const [latestTemperature, setLatestTemperature] = useState(null);
  const [temperatureData, setTemperatureData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Fetch Latest Temperature
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

  // ✅ Fetch Historical Data
  const fetchHistoricalData = async (date) => {
    try {
      let query = supabase.from('temperature_data').select('*').order('created_at', { ascending: true });

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query.gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString());
      }

      let { data, error } = await query;
      if (error) throw error;
      setTemperatureData(data);
      setCurrentPage(1); // Reset to first page on new data fetch
    } catch (error) {
      console.error('Error fetching temperature data:', error);
    }
  };

  // ✅ Paginate Data
  const totalPages = Math.ceil(temperatureData.length / itemsPerPage);
  const paginatedData = temperatureData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ✅ Pagination Controls
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // ✅ Chart Data
  const chartData = {
    labels: temperatureData.map(item => new Date(item.created_at)),
    datasets: [
      {
        label: 'Water Temperature (°C)',
        data: temperatureData.map(item => ({
          x: new Date(item.created_at),
          y: item.temperature,
        })),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
      },
    ],
  };

  // ✅ Chart Options
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
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Water Temperature (°C)',
        },
      },
    },
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Water Temperature Trends' },
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
      await fetchLatestTemperature();
      await fetchHistoricalData(selectedDate);
    };

    fetchData();

    // ✅ Real-time Subscription
    const temperatureSubscription = supabase
      .channel('realtime:temperature_data')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'temperature_data' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(temperatureSubscription);
    };
  }, [selectedDate]);

  return (
    <div className="temperature-container">
      <Navbar />
      <div className="temperature-content">
        <h1 className="temperature-title">Water Temperature Data</h1>

        {/* Latest Data Card */}
        <div className="card-grid">
          <div className="humidity-card">
            <div className="humidity-card-content">
              <div className="humidity-card-title">WATER TEMPERATURE</div>
              <div className="humidity-card-description">
                {latestTemperature ? `${latestTemperature.temperature}°C` : 'Loading...'}
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
            customInput={<button className="date-picker-btn">{selectedDate ? selectedDate.toLocaleDateString() : "Select a Date"}</button>}
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
              <h2>Temperature Logs</h2>
              <button className="close-modal-btn" onClick={() => setIsHistoryModalOpen(false)}>Close</button>
              
              <table className="temperature-table">
                <thead>
                  <tr>
                    <th>Temperature (°C)</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.temperature}°C</td>
                      <td>{new Date(item.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pagination">
                <button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watertemp;
