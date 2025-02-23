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

const Food = () => {
  const [latestFeeder, setLatestFeeder] = useState(null);
  const [feederData, setFeederData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Fetch Latest Feeder Data
  const fetchLatestFeeder = async () => {
    try {
      let { data, error } = await supabase
        .from('feeder')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data.length > 0) {
        setLatestFeeder(data[0]);
      }
    } catch (error) {
      console.error('Error fetching latest feeder data:', error);
    }
  };

  // ✅ Fetch Historical Data
  const fetchHistoricalData = async (date) => {
    try {
      let query = supabase.from('feeder').select('*').order('created_at', { ascending: true });

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query.gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString());
      }

      let { data, error } = await query;
      if (error) throw error;
      setFeederData(data);
      setCurrentPage(1); // Reset page when new data is fetched
    } catch (error) {
      console.error('Error fetching feeder data:', error);
    }
  };

  // ✅ Paginate Data
  const totalPages = Math.ceil(feederData.length / itemsPerPage);
  const paginatedData = feederData.slice(
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
    labels: feederData.map(item => new Date(item.created_at)),
    datasets: [
      {
        label: 'Feeder Distance (cm)',
        data: feederData.map(item => ({
          x: new Date(item.created_at),
          y: item.distance,
        })),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
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
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Feeder Distance (cm)',
        },
      },
    },
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Feeder Distance Trends' },
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
        },
      },
    },
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchLatestFeeder();
      await fetchHistoricalData(selectedDate);
    };

    fetchData();

    // ✅ Real-time Subscription
    const feederSubscription = supabase
      .channel('realtime:feeder')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feeder' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(feederSubscription);
    };
  }, [selectedDate]);

  return (
    <div className="feeder-container">
      <Navbar />
      <div className="feeder-content">
        <h1 className="feeder-title">Feeder Data</h1>

        {/* Latest Data Card */}
        <div className="card-grid">
          <div className="humidity-card">
            <div className="humidity-card-content">
              <div className="humidity-card-title">FEEDER DISTANCE</div>
              <div className="humidity-card-description">
                {latestFeeder ? `${latestFeeder.distance} cm` : 'Loading...'}
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
              <h2>Feeder Logs</h2>
              <button className="close-modal-btn" onClick={() => setIsHistoryModalOpen(false)}>Close</button>

              <table className="temperature-table">
                <thead>
                  <tr>
                    <th>Distance (cm)</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.distance} cm</td>
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

export default Food;
