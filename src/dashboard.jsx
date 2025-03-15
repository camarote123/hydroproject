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
import { supabase } from './createClient';
import './dashboard.css';
import Navbar from './navbar';
import Navbar2 from './navbar2';

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
  const [historyData, setHistoryData] = useState([]);
  const [harvestData, setHarvestData] = useState([]);
  const [soilData, setSoilData] = useState([]);
  const [hydroData, setHydroData] = useState([]);
  const [soilmonitoringData, setSoilMonitoring] = useState([]);
  const [soilmonitoring2Data, setSoilMonitoring2] = useState([]);
  const [phlevelData, setPhlevel] = useState([]);
  const [npkData, setNpk] = useState([]);

  const fetchNpk = async () => {
    try {
      const { data, error } = await supabase
        .from('npk')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setNpk(data);
    } catch (error) {
      console.error('Error fetching npk data:', error);
    }
  };

  const fetchPhlevel = async () => {
    try {
      const { data, error } = await supabase
        .from('ph_level')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhlevel(data);
    } catch (error) {
      console.error('Error fetching ph_level data:', error);
    }
  };

  const fetchSoilMonitoring = async () => {
    try {
      const { data, error } = await supabase
        .from('soil_moisture3')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setSoilMonitoring(data);
    } catch (error) {
      console.error('Error fetching Soil Montoring data:', error);
    }
  };

  const fetchSoilMonitoring2 = async () => {
    try {
      const { data, error } = await supabase
        .from('soil_moisture4')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setSoilMonitoring2(data);
    } catch (error) {
      console.error('Error fetching Soil Montoring data:', error);
    }
  };

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

  const fetchHistoryData = async () => {
    try {
      const { data, error } = await supabase.from('history').select('*').order('date_created', { descending: false });
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
    fetchHistoryData();
    fetchHarvestData();
    fetchSoilMonitoring();
    fetchSoilMonitoring2();
    fetchPhlevel();
    fetchNpk();

    const intervalId = setInterval(() => {
      fetchHumidityData();
      fetchDoData();
      fetchTemperatureData();
      fetchWaterLevelData();
      fetchWaterData();
      fetchFeederData();
      fetchHistoryData();
      fetchHarvestData();
      fetchSoilMonitoring();
      fetchSoilMonitoring2();
      fetchPhlevel();
      fetchNpk();
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

  const historytotal = historyData.length;

  const combinedChartData = {
    labels: sortedDates, // Merge the labels (dates)
    datasets: [
      {
        label: 'Hydroponic Plants',
        data: sortedDates.map((date) => hydroponicCounts[date] || 0), // Map data to sorted dates
        backgroundColor: 'rgba(214, 166, 7, 0.81)',
        borderColor: 'rgb(233, 236, 235)',
        borderWidth: 1,
      },
      {
        label: 'Soil-based Plants',
        data: sortedDates.map((date) => soilCounts[date] || 0), // Map data to sorted dates
        backgroundColor: 'rgba(19, 104, 19, 0.94)',
        borderColor: 'rgb(255, 255, 255)',
        borderWidth: 1,
      },
    ],
  };

  const combinedChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `Total Plants Planted (Total: ${historytotal})`,
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
        backgroundColor: 'rgba(19, 104, 19, 0.94)',
        borderColor: 'rgb(253, 253, 253)',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Harvested Plants Data',
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
          backgroundColor: ['#136813', '#D6A607', '#0E4D4D', '#8B5E3B', '#C97A14', '#5A6E3A', '#A67C00'],
      
        },
      ],
    };
  };

  const soilPieChartData = getPieChartData(soilData);
  const hydroPieChartData = getPieChartData(hydroData);

  // Calculate totals for each pie chart
  const soilTotal = soilData.length;
  const hydroTotal = hydroData.length;
  const harvestTotal = harvestData.length;
 

  const pieChartOptions3 = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'right', // Move legend to the side
        labels: {
          font: {
            size: 14,
          },
          color: '#333', // Adjust text color
        },
      },
      title: {
        display: true,
        text: `SOIL (Total: ${soilTotal})`,
        font: {
          size: 18,
        },
        color: '#000',
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0,0,0,0.7)',
        bodyFont: {
          size: 14,
        },
      },
    },
  };

  const pieChartOptions2 = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'right', // Move legend to the side
        labels: {
          font: {
            size: 14,
          },
          color: '#333', // Adjust text color
        },
      },
      title: {
        display: true,
        text: `HYDROPONICS (Total: ${hydroTotal})`,
        font: {
          size: 18,
        },
        color: '#000',
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0,0,0,0.7)',
        bodyFont: {
          size: 14,
        },
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
        backgroundColor: ['#136813', '#D6A607', '#0E4D4D', '#8B5E3B', '#C97A14', '#5A6E3A', '#A67C00', '#8B3A3A', '#2D4821', '#C4A484'],
        borderColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'right', // Move legend to the side
        labels: {
          font: {
            size: 14,
          },
          color: '#333', // Adjust text color
        },
      },
      title: {
        display: true,
        text: `Harvested Plants (Total: ${harvestTotal})`,
        font: {
          size: 18,
        },
        color: '#000',
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0,0,0,0.7)',
        bodyFont: {
          size: 14,
        },
      },
    },
  };

  return (
    <div className="dashboard-container">
      <Navbar />
      <Navbar2/>
      

      {/* Header Row with Title and Environment Text */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Monitoring Dashboard</h1>

        <div className="environment-info">
          <h2 className="environment-title">ENVIRONMENT</h2>
          <div className="environment-readings">
            <div className="environment-reading">
              <span className="reading-label">HUMIDITY:</span>
              <span className="reading-value">{humidityData.length > 0 ? `${humidityData[0].humidity}°C` : 'Loading...'}</span>
            </div>
            <div className="environment-reading">
              <span className="reading-label">TEMPERATURE:</span>
              <span className="reading-value">{humidityData.length > 0 ? `${humidityData[0].temperature}°C` : 'Loading...'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SOIL SECTION */}
      <div className="dashboard-section">
        <h2 className="section-title">SOIL</h2>
        <div className="dashboard-card-grid">
          {/* Soil Moisture Cards */}
          <div className="dashboard-card">
            <div className="dashboard-card-content">
              <div className="dashboard-card-title">SOIL MOISTURE 1</div>
              <div className="dashboard-card-description">
                {soilmonitoringData.length > 0 ? `${soilmonitoringData[0].moisture}%` : 'Loading...'}
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-content">
              <div className="dashboard-card-title">SOIL MOISTURE 2</div>
              <div className="dashboard-card-description">
                {soilmonitoringData.length > 0 ? `${soilmonitoringData[0].moisture2}%` : 'Loading...'}
              </div>
            </div>
          </div>

          <div className="dashboard-card">
        <div className="dashboard-card-content">
          <div className="dashboard-card-title">SOIL MOISTURE 3</div>
          <div className="dashboard-card-description">
            {soilmonitoring2Data.length > 0 ? `${soilmonitoring2Data[0].moisture}%` : 'Loading...'}
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="dashboard-card-content">
          <div className="dashboard-card-title">SOIL MOISTURE 4</div>
          <div className="dashboard-card-description">
            {soilmonitoring2Data.length > 0 ? `${soilmonitoring2Data[0].moisture2}%` : 'Loading...'}
          </div>
        </div>
      </div>

      {/* NPK Cards */}
      <div className="dashboard-card">
        <div className="dashboard-card-content">
          <div className="dashboard-card-title">NITROGEN</div>
          <div className="dashboard-card-description">
            {npkData.length > 0 ? `${npkData[0].nitrogen} PPM` : 'Loading...'}
          </div>
        </div>
      </div>
 
      <div className="dashboard-card">
        <div className="dashboard-card-content">
          <div className="dashboard-card-title">PHOSPHORUS</div>
          <div className="dashboard-card-description">
            {npkData.length > 0 ? `${npkData[0].phosphorus}PPM` : 'Loading...'}
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="dashboard-card-content">
          <div className="dashboard-card-title">POTASSIUM</div>
          <div className="dashboard-card-description">
            {npkData.length > 0 ? `${npkData[0].potassium}PPM` : 'Loading...'}
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* AQUACULTURE SECTION */}
  <div className="dashboard-section">
    <h2 className="section-title">AQUACULTURE</h2>
    <div className="dashboard-card-grid">
      <div className="dashboard-card">
        <div className="dashboard-card-content">
          <div className="dashboard-card-title">WATER TEMPERATURE</div>
          <div className="dashboard-card-description">
            {temperatureData.length > 0 ? `${temperatureData[0].temperature}°C` : 'Loading...'}
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="dashboard-card-content">
          <div className="dashboard-card-title">PH LEVEL</div>
          <div className="dashboard-card-description">
            {phlevelData.length > 0 ? `pH: ${phlevelData[0].ph_level}` : 'Loading...'}
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="dashboard-card-content">
          <div className="dashboard-card-title">DISSOLVED OXYGEN</div>
          <div className="dashboard-card-description">
            {doData.length > 0 ? `${doData[0].do_level} mg/L` : 'Loading...'}
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="dashboard-card-content">
          <div className="dashboard-card-title">POND WATER LEVEL</div>
          <div className="dashboard-card-description">
            {waterLevelData.length > 0 ? `${waterLevelData[0].water_level}%` : 'Loading...'}
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="dashboard-card-content">
          <div className="dashboard-card-title">RESERVOIR WATER LEVEL</div>
          <div className="dashboard-card-description">
            {waterData.length > 0 ? `${waterData[0].distance} cm` : 'Loading...'}
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="dashboard-card-content">
          <div className="dashboard-card-title">FEEDER</div>
          <div className="dashboard-card-description">
            {feederData.length > 0 ? `${feederData[0].distance} cm` : 'Loading...'}
          </div>
        </div>
      </div>
    </div>
  </div>



          

          <br />
          <br />
          <br />


          <div className="chart-wrapper">
  {/* Pie Chart Section */}
  <div className="piechart-container">
    <Pie data={soilPieChartData} options={pieChartOptions3} />
    <Pie data={pieChartData} options={pieChartOptions} />
    <Pie data={hydroPieChartData} options={pieChartOptions2} />
  </div>

  {/* Bar Chart Section */}
  <div className="barchart-container">
    <Bar data={combinedChartData} options={combinedChartOptions} />
    <Bar data={barChartData} options={barChartOptions} />
  </div>
</div>



        
        </div>


  );
};

export default Dashboard;
