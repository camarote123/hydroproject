import { createClient } from '@supabase/supabase-js';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import React, { useEffect, useState } from 'react';
import Navbar from './navbar';
import Navbar2 from './navbar2';
import './registration.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Initialize Supabase client
const supabaseUrl = 'https://blxxjmoszhndbfgqrprb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJseHhqbW9zemhuZGJmZ3FycHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwMzkyMjEsImV4cCI6MjA0NzYxNTIyMX0._WjnfmgLYBaJP6g64fiCM__a7JWbXPDaZBK_j2yIvV8';
const supabase = createClient(supabaseUrl, supabaseKey);

const Harvest = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [growthSiteFilter, setGrowthSiteFilter] = useState('All');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15; // Max 20 records per page

  useEffect(() => {
    fetchHarvestData();
  }, []);

  useEffect(() => {
    let filtered = data;

    if (startDate && endDate) {
      filtered = filtered.filter((record) => {
        const harvestedDate = new Date(record.date_harvested);
        return harvestedDate >= new Date(startDate) && harvestedDate <= new Date(endDate);
      });
    }

    if (growthSiteFilter !== 'All') {
      filtered = filtered.filter((record) => record.growth_site === growthSiteFilter);
    }

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to the first page when filters change
  }, [startDate, endDate, data, growthSiteFilter]);

  const fetchHarvestData = async () => {
    setLoading(true);
    try {
      const { data: harvestData, error } = await supabase.from('harvest').select('*');
      if (error) {
        console.error('Error fetching harvest data:', error.message);
      } else {
        setData(harvestData);
        setFilteredData(harvestData); // Set initial data to filteredData
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Harvest Records</title></head><body>');
    printWindow.document.write('<h1>Harvest Records</h1>');

    printWindow.document.write('<table border="1" style="width: 100%; border-collapse: collapse;">');
    printWindow.document.write('<thead><tr><th>Growth Site</th><th>Plant Name</th><th>Registration ID</th><th>Harvest Duration</th><th>Date Created</th><th>Date Harvested</th></tr></thead>');
    printWindow.document.write('<tbody>');
    filteredData.forEach((record) => {
      printWindow.document.write(`
        <tr>
          <td>${record.growth_site}</td>
          <td>${record.plant_name}</td>
          <td>${record.registration_id}</td>
          <td>${record.harvest_duration}</td>
          <td>${record.date_created}</td>
          <td>${record.date_harvested}</td>
        </tr>
      `);
    });
    printWindow.document.write('</tbody></table>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  // Format date for the chart
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Aggregate data for bar chart
 



 

  // Pagination calculations
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredData.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);

  return (
    <div>
      <Navbar />
      <Navbar2 />
      <h1>Harvest Records</h1>
   

      <div className="filter-section">
        <label>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label>
          End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>

        <label>
          <select
            value={growthSiteFilter}
            onChange={(e) => setGrowthSiteFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Hydroponics">Hydroponics</option>
            <option value="Soil Based">Soil Based</option>
          </select>
        </label>
      </div>



      <div >
        <table className = 'harvesttable' border="1" style={{ width: '1200px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Growth Site</th>
              <th>Plant Name</th>
              <th>Registration ID</th>
              <th>Harvest Duration</th>
              <th>Date Created</th>
              <th>Date Harvested</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.growth_site}</td>
                <td>{record.plant_name}</td>
                <td>{record.registration_id}</td>
                <td>{record.harvest_duration}</td>
                <td>{record.date_created}</td>
                <td>{record.date_harvested}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="pagination">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      <br />
      <button onClick={handlePrint}>Print</button>

    </div>
  );
};

export default Harvest;
