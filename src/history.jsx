import { createClient } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import './registration.css';

// Initialize Supabase client
const supabaseUrl = 'https://gwpdficziacsggfhtsff.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cGRmaWN6aWFjc2dnZmh0c2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MDcxNzMsImV4cCI6MjA1MTQ4MzE3M30.k251ml-KLw4M7TTtcpZyHh659qoO0HI9wCNUihwzxqM';
const supabase = createClient(supabaseUrl, supabaseKey);

const History = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [growthSiteFilter, setGrowthSiteFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  useEffect(() => {
    fetchHistoryData();
  }, [growthSiteFilter, startDate, endDate]);

  const fetchHistoryData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('history').select('*');
      if (error) {
        console.error('Error fetching history data:', error.message);
      } else {
        let filteredData = data;

        if (growthSiteFilter) {
          filteredData = filteredData.filter(
            (record) => record.growth_site.toLowerCase() === growthSiteFilter.toLowerCase()
          );
        }

        if (startDate || endDate) {
          filteredData = filteredData.filter((record) => {
            const recordDate = new Date(record.date_created);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            return (!start || recordDate >= start) && (!end || recordDate <= end);
          });
        }

        filteredData.sort((a, b) => new Date(b.date_created) - new Date(a.date_created));
        setHistoryData(filteredData);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>History Records</title></head><body>');
    printWindow.document.write('<h1>History Records</h1>');

    printWindow.document.write('<table border="1" style="width: 100%; border-collapse: collapse;">');
    printWindow.document.write('<thead><tr><th>Plant Name</th><th>Plant ID</th><th>Growth Site</th><th>Harvest Duration</th><th>Date Created</th><th>Expected Harvest Date</th></tr></thead>');
    printWindow.document.write('<tbody>');
    historyData.forEach((record) => {
      printWindow.document.write(`
        <tr>
          <td>${record.plant_name}</td>
          <td>${record.registration_id}</td>
          <td>${record.growth_site}</td>
          <td>${record.harvest_duration}</td>
          <td>${record.date_created}</td>
          <td>${record.expected_harvest_date}</td>
        </tr>
      `);
    });
    printWindow.document.write('</tbody></table>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US');
  };

  // Pagination Logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = historyData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(historyData.length / rowsPerPage);

  return (
    <div>
      <h1>History</h1>

      {/* Filters */}
      <div className='filter-section'>
        

        <label>Start    Date:
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>

        <label>End Date:
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>


      <label>
        <select onChange={(e) => setGrowthSiteFilter(e.target.value)} value={growthSiteFilter}>
          <option value="">All</option>
          <option value="Hydroponics">Hydroponics</option>
          <option value="Soil based">Soil Based</option>
        </select>
        </label>
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>Plant Name</th>
            <th>PLANT ID</th>
            <th>Growth Site</th>
            <th>Harvest Duration (Days)</th>
            <th>Date Created</th>
            <th>Expected Harvest Date</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="6">Loading...</td>
            </tr>
          ) : currentRows.length === 0 ? (
            <tr>
              <td colSpan="6">No matching records found.</td>
            </tr>
          ) : (
            currentRows.map((record) => (
              <tr key={record.id}>
                <td>{record.plant_name}</td>
                <td>{record.registration_id}</td>
                <td>{record.growth_site}</td>
                <td>{record.harvest_duration}</td>
                <td>{formatDate(record.date_created)}</td>
                <td>{formatDate(record.expected_harvest_date)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>

      <br />
      <button onClick={handlePrint}>Print</button>
    </div>
  );
};

export default History;
