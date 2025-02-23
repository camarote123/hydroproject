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

const Do = () => {
  const [doData, setDoData] = useState([]);
  const [latestDo, setLatestDo] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Fetch Latest DO Level for Card
  const fetchLatestDo = async () => {
    try {
      const { data, error } = await supabase
        .from('dissolved_oxygen')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data.length > 0) {
        setLatestDo(data[0]);
      }
    } catch (error) {
      console.error('Error fetching latest DO data:', error);
    }
  };

  // ✅ Fetch Historical Data
  const fetchHistoricalData = async (date) => {
    try {
      let query = supabase.from('dissolved_oxygen').select('*').order('created_at', { ascending: true });

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query.gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString());
      }

      let { data, error } = await query;
      if (error) throw error;
      setDoData(data);
      setCurrentPage(1); // Reset to first page when new data is fetched
    } catch (error) {
      console.error('Error fetching DO data:', error);
    }
  };

  // ✅ Chart Data
  const chartData = {
    labels: doData.map(item => new Date(item.created_at)),
    datasets: [
      {
        label: 'Dissolved Oxygen (mg/L)',
        data: doData.map(item => ({
          x: new Date(item.created_at),
          y: item.do_level,
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
          text: 'Dissolved Oxygen (mg/L)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Dissolved Oxygen Trends',
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
            chart.update('none');
          },
        },
      },
    },
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchLatestDo();
      await fetchHistoricalData(selectedDate);
    };

    fetchData();

    // ✅ Subscribe to real-time changes in 'dissolved_oxygen'
    const doSubscription = supabase
      .channel('realtime:dissolved_oxygen')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dissolved_oxygen' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(doSubscription);
    };
  }, [selectedDate]);

  // ✅ Pagination logic
  const totalPages = Math.ceil(doData.length / itemsPerPage);
  const paginatedData = doData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="do-container">
      <Navbar />
      <div className="do-content">
        <h1 className="temperature-title">Dissolved Oxygen Data</h1>

        {/* Card Section */}
        <div className="card-grid">
          <div className="humidity-card">
            <div className="humidity-card-content">
              <div className="humidity-card-title">DISSOLVED OXYGEN</div>
              <div className="humidity-card-description">
                {latestDo ? `${latestDo.do_level} mg/L` : 'Loading...'}
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

              <table className="do-table">
                <thead>
                  <tr>
                    <th>Dissolved Oxygen (mg/L)</th>
                    <th>Pump Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.do_level} mg/L</td>
                      <td>{item.pump_status}</td>
                      <td>{new Date(item.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="pagination">
                <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Do;
