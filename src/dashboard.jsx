import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import './aqua.css';
import { supabase } from './createClient';
import Navbar from './navbar';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [humidityData, setHumidityData] = useState([]);
  const [doData, setDoData] = useState([]);
  const [temperatureData, setTemperatureData] = useState([]);
  const [waterLevelData, setWaterLevelData] = useState([]);
  const [waterData, setWaterData] = useState([]);
  const [feederData, setFeederData] = useState([]);
  const [soilMoistureData, setSoilMoistureData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [harvestData, setHarvestData] = useState([]);
  const [soilData, setSoilData] = useState([]);
  const [hydroData, setHydroData] = useState([]);

  // Fetch data for each sensor and store it in state
  const fetchHumidityData = async () => {
    try {
      const { data, error } = await supabase
        .from('humidity')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setHumidityData(data);
    } catch (error) {
      console.error('Error fetching humidity data:', error);
    }
  };

  const fetchDoData = async () => {
    try {
      const { data, error } = await supabase
        .from('dissolved_oxygen')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDoData(data);
    } catch (error) {
      console.error('Error fetching dissolved oxygen data:', error);
    }
  };

  const fetchTemperatureData = async () => {
    try {
      const { data, error } = await supabase
        .from('temperature_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemperatureData(data);
    } catch (error) {
      console.error('Error fetching temperature data:', error);
    }
  };

  const fetchWaterLevelData = async () => {
    try {
      const { data, error } = await supabase
        .from('water_levels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWaterLevelData(data);
    } catch (error) {
      console.error('Error fetching water level data:', error);
    }
  };

  const fetchWaterData = async () => {
    try {
      const { data, error } = await supabase
        .from('water_data')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setWaterData(data);
    } catch (error) {
      console.error('Error fetching water data:', error);
    }
  };

  const fetchFeederData = async () => {
    try {
      const { data, error } = await supabase
        .from('feeder')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeederData(data);
    } catch (error) {
      console.error('Error fetching feeder data:', error);
    }
  };

  const fetchSoilMoistureData = async () => {
    try {
      const { data, error } = await supabase
        .from('soil_moisture')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setSoilMoistureData(data);
    } catch (error) {
      console.error('Error fetching soil moisture data:', error);
    }
  };

  const fetchHistoryData = async () => {
    try {
      const { data, error } = await supabase.from('history').select('*') .order('date_created', {descending: false}) ;
      if (error) {
        console.error('Error fetching history data:', error.message);
      } else {
        setHistoryData(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const fetchHarvestData = async () => {
    try {
      const { data, error } = await supabase
        .from('harvest')
        .select('*')
        .order('date_harvested', { descending: false });

      if (error) throw error;
      setHarvestData(data);
    } catch (error) {
      console.error('Error fetching harvest data:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: registrationData, error } = await supabase
          .from('registration')
          .select('*');

        if (error) {
          console.error('Error fetching data:', error.message);
          return;
        }

        // Filter data into Soil-Based and Hydroponics
        const soilRecords = registrationData.filter(
          (record) => record.growth_site === 'Soil Based'
        );
        const hydroRecords = registrationData.filter(
          (record) => record.growth_site === 'Hydroponics'
        );

        // Set the state
        setSoilData(soilRecords);
        setHydroData(hydroRecords);
      } catch (err) {
        console.error('Error fetching registration data:', err);
      }
    };

    fetchData();
  }, []);

   // Function to get the pie chart data



  useEffect(() => {
    // Fetch data initially and set up the interval
    fetchHumidityData();
    fetchDoData();
    fetchTemperatureData();
    fetchWaterLevelData();
    fetchWaterData();
    fetchFeederData();
    fetchSoilMoistureData();
    fetchHistoryData();
    fetchHarvestData();

    const intervalId = setInterval(() => {
      fetchHumidityData();
      fetchDoData();
      fetchTemperatureData();
      fetchWaterLevelData();
      fetchWaterData();
      fetchFeederData();
      fetchSoilMoistureData();
      fetchHistoryData();
      fetchHarvestData();
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  // Format date for the charts
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Count plants by growth system (Hydroponic vs. Soil-based)
  const countPlantsByDateAndSystem = () => {
    const hydroponicCounts = {};
    const soilCounts = {};

    historyData.forEach((record) => {
      const date = formatDate(record.date_created);
      const growthSystem = record.growth_site.toLowerCase().includes('hydroponic') ? 'Hydroponic' : 'Soil-based';

      if (growthSystem === 'Hydroponic') {
        if (!hydroponicCounts[date]) hydroponicCounts[date] = 0;
        hydroponicCounts[date]++;
      } else {
        if (!soilCounts[date]) soilCounts[date] = 0;
        soilCounts[date]++;
      }
    });

    return { hydroponicCounts, soilCounts };
  };

  // Prepare data for the combined chart
  const { hydroponicCounts, soilCounts } = countPlantsByDateAndSystem();

  const allDates = [...new Set([...Object.keys(hydroponicCounts), ...Object.keys(soilCounts)])];
const sortedDates = allDates.sort((a, b) => new Date(a) - new Date(b)); // Sort descending

  const combinedChartData = {
    labels: sortedDates, // Merge the labels (dates)
    datasets: [
      {
        label: 'Hydroponic Plants',
        data: sortedDates.map((date) => hydroponicCounts[date] || 0), // Map data to sorted dates
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Soil-based Plants',
        data: sortedDates.map((date) => soilCounts[date] || 0), // Map data to sorted dates
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const combinedChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Plants Planted',
      },
    },
  };

  // Aggregate harvest data for bar chart
  const harvestCountByDate = () => {
    const countByDate = {};
    harvestData.forEach((record) => {
      const date = formatDate(record.date_harvested);
      countByDate[date] = countByDate[date] ? countByDate[date] + 1 : 1;
    });
    return countByDate;
  };

  const harvestDataForChart = harvestCountByDate();

  const barChartData = {
    labels: Object.keys(harvestDataForChart),
    datasets: [
      {
        label: 'Number of Harvests',
        data: Object.values(harvestDataForChart),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Harvest Count by Date',
      },
    },
  };

  

  const getPieChartData = (data) => {
    const plantNameCount = data.reduce((acc, record) => {
      acc[record.plant_name] = (acc[record.plant_name] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(plantNameCount),
      datasets: [
        {
          data: Object.values(plantNameCount),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#FF9F40'],
          hoverBackgroundColor: ['#FF4C72', '#2F83C4', '#F9B936', '#33C9C0', '#F79D41'],
        },
      ],
    };
  };

  const soilPieChartData = getPieChartData(soilData);
  const hydroPieChartData = getPieChartData(hydroData);

  const pieChartOptions3 = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'SOIL',
      },
    },
  };

  const pieChartOptions2 = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'HYDROPONICS',
      },
    },
  };
  const harvestNameCount = () => {
    const countByName = {};
    harvestData.forEach((record) => {
      const harvestName = record.plant_name;
      countByName[harvestName] = countByName[harvestName] ? countByName[harvestName] + 1 : 1;
    });
    return countByName;
  };

  const harvestNameData = harvestNameCount();

  const pieChartData = {
    labels: Object.keys(harvestNameData),
    datasets: [
      {
        label: 'Harvest Names',
        data: Object.values(harvestNameData),
        backgroundColor: [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#C9CBCF', '#00A36C', '#8A2BE2', '#DC143C',
  '#20B2AA', '#D2691E', '#FF1493', '#1E90FF', '#32CD32'
],
        borderColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Harvested Plants',
      },
    },
  };


  return (
   
    <div className="dashboard-container">
   
      <Navbar />
   
        <h1 className="dashboard-title">Monitoring Dashboard</h1>
        <div className="dashboard-card">
          {/* Card Grid */}
          <div className="dashboard-card-grid">
            {/* Data Cards */}
            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title">HUMIDITY</div>
                <div className="humidity-card-description">
                  {humidityData.length > 0 ? `${humidityData[0].humidity}%` : 'Loading...'}
                </div>
              </div>
            </div>

            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title">TEMPERATURE</div>
                <div className="humidity-card-description">
                  {humidityData.length > 0 ? `${humidityData[0].temperature}°C` : 'Loading...'}
                </div>
              </div>
            </div>

            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title"> WATER TEMPERATURE</div>
                <div className="humidity-card-description">
                  {temperatureData.length > 0 ? `${temperatureData[0].temperature}°C` : 'Loading...'}
                </div>
              </div>
            </div>

            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title">DISSOLVED OXYGEN</div>
                <div className="humidity-card-description">
                  {doData.length > 0 ? `${doData[0].do_level} mg/L` : 'Loading...'}
                </div>
              </div>
            </div>

            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title">HYDRO WATER LEVEL</div>
                <div className="humidity-card-description">
                  {waterLevelData.length > 0 ? `${waterLevelData[0].water_level}%` : 'Loading...'}
                </div>
              </div>
            </div>

            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title">WATER DISTANCE</div>
                <div className="humidity-card-description">
                  {waterData.length > 0 ? `${waterData[0].distance} cm` : 'Loading...'}
                </div>
              </div>
            </div>

            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title">FEEDER </div>
                <div className="humidity-card-description">
                  {feederData.length > 0 ? `${feederData[0].distance} cm` : 'Loading...'}
                </div>
              </div>
            </div>

            <div className="humidity-card">
              <div className="humidity-card-content">
                <div className="humidity-card-title">SOIL MOISTURE</div>
                <div className="humidity-card-description">
                  {soilMoistureData.length > 0 ? `${soilMoistureData[0].moisture}%` : 'Loading...'}
                </div>
              </div>
            </div>
          </div>
          

          <br />
          <br />
          <br />

       
          <div className="piechart">
            <Pie data={soilPieChartData} options={pieChartOptions3} />
            <Pie data={pieChartData} options={pieChartOptions} />
            <Pie data={hydroPieChartData} options={pieChartOptions2} />
          </div>
      

  {/* Combined Bar Graph */}
  <div className="chart-container">
            <div className="dashboard-chart">
              <Bar data={combinedChartData} options={combinedChartOptions} />
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>
         

          <br />
   
         
        </div>
      </div>

  );
};

export default Dashboard;
