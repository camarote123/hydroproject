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
);

const Pesticide = () => {
  const [pumpScheduleData, setPumpScheduleData] = useState([]);
  const [latestData, setLatestData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;
  const navigate = useNavigate();
  const totalRecordsRef = useRef(0);
  const allDataRef = useRef([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch Latest Data for Card Grid
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

  // ✅ Fetch Historical Data
  const fetchHistoricalData = async (date, from = 0, to = 1000) => {
    setLoading(true);
    try {
      let query = supabase
        .from('pesticide_distance')
        .select('*', { count: 'exact' }) // ✅ Ensure count is retrieved
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

      // ✅ Convert timestamps to UTC+8
      const adjustedData = data.map(item => ({
        ...item,
        created_at: new Date(new Date(item.created_at).getTime() + 8 * 60 * 60 * 1000),
      }));

      if (from === 0) {
        setPumpScheduleData(adjustedData);
      } else {
        setPumpScheduleData(prevData => [...prevData, ...adjustedData]);
      }

      allDataRef.current = [...allDataRef.current, ...adjustedData];
      if (count !== null) totalRecordsRef.current = count; // ✅ Ensure count is updated

    } catch (error) {
      console.error('Error fetching pesticide distance data:', error);
    }
    setLoading(false);
  };

  // ✅ Paginate Data
  const paginatedData = pumpScheduleData.slice(
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
    labels: pumpScheduleData.map(item => new Date(item.created_at)), // Already adjusted in fetchHistoricalData
    datasets: [
      {
        label: 'Distance',
        data: pumpScheduleData.map(item => ({
          x: new Date(item.created_at),
          y: item.distance,
        })),
        borderColor: 'rgba(19, 104, 19, 0.94)',
        backgroundColor: 'rgba(19, 104, 19, 0.94)',
        fill: true,
        pointRadius: 0, // Remove dots on the graph
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
          text: 'Distance',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Pesticide Distance Trends',
      },
    },
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchLatestData();
      await fetchHistoricalData(selectedDate);
    };
  
    fetchData(); // Initial fetch
  
    // Subscribe to changes in the 'pesticide_distance' table
    const pumpScheduleSubscription = supabase
      .channel('realtime:pesticide_distance')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pesticide_distance' }, 
        (payload) => {
          const newRecord = {
            ...payload.new,
            created_at: new Date(new Date(payload.new.created_at).getTime() + 8 * 60 * 60 * 1000), // UTC+8 conversion
          };
          setPumpScheduleData((prevData) => [...prevData, newRecord]); // Append new record
          allDataRef.current = [...allDataRef.current, newRecord];
          setLatestData(newRecord); // Update latest data
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(pumpScheduleSubscription); // Cleanup subscription on unmount
    };
  }, [selectedDate]);

  return (
    <div className="humidity-container">
      <Navbar />
      <div className="humidity-content">
        <h1 className="humidity-title">Pesticide Distance Data</h1>
        <div className="humiditycontainer">
          {/* Card Grid */}
          <div className="card-grid">
            {/* Card - PESTICIDE DISTANCE */}
            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title">PESTICIDE DISTANCE DATA</div>
                <div className="humidity-card-description">
                  {latestData ? `${latestData.distance} ` : 'Loading...'}
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
            customInput={<button className="date-picker-btn">{selectedDate ? selectedDate.toLocaleDateString() : "Select Date"}</button>}
          />
        </div>

        {/* ✅ Graph */}
        <div className="graph-container" style={{ height: '400px', marginTop: '20px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* ✅ History Modal */}
        <button className="history-button" onClick={() => setIsHistoryModalOpen(true)}>View History</button>
        
        <div>
          <br></br>
          <button onClick={() => navigate('/soilmonitoring2')}>BACK</button>
          <button onClick={() => navigate('/npk')}>NEXT</button>
        </div>

        {isHistoryModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Pesticide Distance Logs</h2>
              <button className="close-modal-btn" onClick={() => setIsHistoryModalOpen(false)}>Close</button>

              {/* ✅ History Table */}
              <table className="pump-schedule-table">
                <thead>
                  <tr>
                    <th>Distance</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.distance} units</td>
                      <td>{new Date(item.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ✅ Pagination Controls */}
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

export default Pesticide;