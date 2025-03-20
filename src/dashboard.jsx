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
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { supabase } from './createClient';
import './dashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Dashboard = () => {
  // State for all sensor data
  const navigate = useNavigate();
  const [humidityData, setHumidityData] = useState([]);
  const [doData, setDoData] = useState([]);
  const [temperatureData, setTemperatureData] = useState([]);
  const [waterLevelData, setWaterLevelData] = useState([]);
  const [waterData, setWaterData] = useState([]);
  const [feederData, setFeederData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [soilmonitoringData, setSoilMonitoring] = useState([]);
  const [soilmonitoring2Data, setSoilMonitoring2] = useState([]);
  const [phlevelData, setPhlevel] = useState([]);
  const [npkData, setNpk] = useState([]);
  const [totalPlants, setTotalPlants] = useState({ soilBased: 0, hydroponic: 0 });
  const [activeBarIndex, setActiveBarIndex] = useState(null);
  const [activeWaterIndex, setActiveWaterIndex] = useState(null);

  const handleNavigation = (id) => {
    if (id === "01" || id === "02") {
      navigate('/soilmonitoring');
    } else if (id === "03" || id === "04") {
      navigate('/soilmonitoring2');
    }
  };

  const handleWaterLevelClick = (index) => {
    if (index === 0) {
      navigate('/hydrowaterlevel');
    } else if (index === 1) {
      navigate('/reservr');
    }
  };

  // Data fetching functions
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
      console.error('Error fetching Soil Monitoring data:', error);
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
      console.error('Error fetching Soil Monitoring data:', error);
    }
  };

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
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .order('date_created', { ascending: false });

      if (error) {
        console.error('Error fetching history data:', error.message);
      } else {
        setHistoryData(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  // Fetch total plants count
  const fetchTotalPlants = async () => {
    try {
      const { data, error } = await supabase
        .from('history')
        .select('growth_site');

      if (error) throw error;

      const soilCount = data.filter(item =>
        item.growth_site === 'Soil Based').length;

      const hydroCount = data.filter(item =>
        item.growth_site === 'Hydroponics').length;

      setTotalPlants({
        soilBased: soilCount,
        hydroponic: hydroCount
      });
    } catch (error) {
      console.error('Error fetching total plants data:', error);
    }
  };

  // Fetch all data initially and set up polling
  useEffect(() => {
    // Fetch data initially
    const fetchAllData = () => {
      fetchHumidityData();
      fetchDoData();
      fetchTemperatureData();
      fetchWaterLevelData();
      fetchWaterData();
      fetchFeederData();
      fetchHistoryData();
      fetchSoilMonitoring();
      fetchSoilMonitoring2();
      fetchPhlevel();
      fetchNpk();
      fetchTotalPlants();
    };

    fetchAllData();

    // Set up polling interval
    const intervalId = setInterval(fetchAllData, 2000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Format date for the charts
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
  };

  // Group plants by week and type
  const countPlantsByWeekAndType = () => {
    const countsByWeek = {};

    historyData.forEach((record) => {
      const date = new Date(record.date_created);
      // Get the week number
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Get Sunday of this week
      const weekKey = formatDate(weekStart);
      const weekLabel = `Week of ${weekKey}`;
      const growthType = record.growth_site?.toLowerCase().includes('hydroponic') ? 'hydroponic' : 'soilBased';

      if (!countsByWeek[weekLabel]) {
        countsByWeek[weekLabel] = { month: weekLabel, soilBased: 0, hydroponic: 0 };
      }
      countsByWeek[weekLabel][growthType]++;
    });

    return Object.values(countsByWeek);
  };

  // Prepare data for the plants by week chart
  const plantsByWeekData = countPlantsByWeekAndType()
    .sort((a, b) => {
      const dateA = new Date(a.month.substring(8));
      const dateB = new Date(b.month.substring(8));
      return dateA - dateB;
    })
    .slice(-5); // Get last 5 weeks

  // Prepare data for PPM chart using NPK data
  const ppmData = [
    {
      name: 'Nitrogen',
      value: npkData.length > 0 ? npkData[0]?.nitrogen || 130 : 130,
      status: npkData.length > 0 && npkData[0]?.nitrogen <= 80 ? 'Low' : 'High',
      color: npkData.length > 0 && npkData[0]?.nitrogen <= 80 ? '#FF5252' : '#FFC107'
    },
    {
      
  name: 'Phosphorus',
  value: npkData.length > 0 ? npkData[0]?.phosphorus || 120 : 120,
  status: npkData.length > 0 && npkData[0]?.phosphorus <= 80 ? 'Low' : 'High',
  color: npkData.length > 0 && npkData[0]?.phosphorus <= 80 ? '#FF5252' : '#4285F4'
    },
    {
  
      name: 'Potassium',
      value: npkData.length > 0 ? npkData[0]?.potassium || 110 : 110,
      status: npkData.length > 0 && npkData[0]?.potassium <= 30 ? 'Low' : 'High',
      color: npkData.length > 0 && npkData[0]?.potassium <= 30 ? '#FF5252' : '#7CB342'
    }
  ]

  // Prepare water level data for bar chart
  const waterLevelChartData = [
    {
      name: 'Pond',
      value: waterLevelData.length > 0 ? waterLevelData[0]?.water_level || 90 : 90,
      color: waterLevelData.length > 0 && waterLevelData[0]?.water_level > 50 ? '#4285F4' : '#FF5252'
    },
    {
      name: 'Reservoir',
      value: waterData.length > 0 ? 100 - (waterData[0]?.distance * 0.5) || 80 : 80,
      color: waterData.length > 0 && (100 - (waterData[0]?.distance * 0.5)) > 50 ? '#4285F4' : '#FF5252'
    }
  ];

  // Custom bar for water level with hover effects
  const CustomWaterBar = (props) => {
    const { x, y, width, height, index, fill, payload } = props;
    const [activeWaterIndex, setActiveWaterIndex] = useState(null);

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill || '#FF5252'} // Default red
          rx={8}
          ry={8}
          className="water-level-bar"
          style={{
            cursor: 'pointer',
            filter: activeWaterIndex === index ? 'brightness(1.2) drop-shadow(0 0 6px rgba(0,0,0,0.3))' : 'none',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={() => setActiveWaterIndex(index)}
          onMouseLeave={() => setActiveWaterIndex(null)}
          onClick={() => handleWaterLevelClick(index)}
        />
        {activeWaterIndex === index && (
          <text
            x={x + width / 2}
            y={y - 10}
            fill="#333"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontWeight: 'bold', fontSize: '14px' }}
          >
            {`${payload.value}%`}
          </text>
        )}
      </g>
    );
  };

  // Custom bar for PPM with hover effects
  
const CustomPpmBar = (props) => {
  const { x, y, width, height, index, fill, payload } = props;
  const [activeBarIndex, setActiveBarIndex] = useState(null); // Fix: Define state

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill || payload.color} // Fix: Use color from ppmData
        rx={10}
        ry={10}
        className="ppm-bar"
        style={{
          cursor: "pointer",
          filter:
            activeBarIndex === index
              ? "brightness(1.2) drop-shadow(0 0 6px rgba(0,0,0,0.3))"
              : "none",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={() => setActiveBarIndex(index)}
        onMouseLeave={() => setActiveBarIndex(null)}
      />
      {activeBarIndex === index && (
        <text
          x={x + width / 2}
          y={y - 10}
          fill="#333"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontWeight: "bold", fontSize: "12px" }}
        >
          {`${payload.value} ppm (${payload.status})`} {/* Display High/Low status */}
        </text>
      )}
    </g>
  );
};

  // Prepare soil moisture data from soil monitoring data
  const soilMoistureData = [
    {
      id: '01',
      name: 'Soil Moisture',
      percent: soilmonitoringData.length > 0 ? Math.min(100, Math.max(0, soilmonitoringData[0]?.moisture || 0)) : 0,
      status: soilmonitoringData.length > 0 && soilmonitoringData[0]?.moisture > 50 ? 'high' : 'low'
    },
    {
      id: '02',
      name: 'Soil Moisture',
      percent: soilmonitoringData.length > 0 ? Math.min(100, Math.max(0, soilmonitoringData[0]?.moisture2 || 0)) : 0,
      status: soilmonitoringData.length > 0 && soilmonitoringData[0]?.moisture2 > 50 ? 'high' : 'low'
    },
    {
      id: '03',
      name: 'Soil Moisture',
      percent: soilmonitoring2Data.length > 0 ? Math.min(100, Math.max(0, soilmonitoring2Data[0]?.moisture || 0)) : 0,
      status: soilmonitoring2Data.length > 0 && soilmonitoring2Data[0]?.moisture > 50 ? 'high' : 'low'
    },
    {
      id: '04',
      name: 'Soil Moisture',
      percent: soilmonitoring2Data.length > 0 ? Math.min(100, Math.max(0, soilmonitoring2Data[0]?.moisture2 || 0)) : 0,
      status: soilmonitoring2Data.length > 0 && soilmonitoring2Data[0]?.moisture2 > 50 ? 'high' : 'low'
    }
  ];

  // Fixed water temperature gauge
  const currentTemp = temperatureData.length > 0 ? temperatureData[0]?.temperature || 70 : 70;
  const maxTemp = 100; // Define maxTemp for the gauge

  // Create gauge data for the semicircle
  // Temperature gauge colors based on ranges
  const getTempGaugeColor = (temp) => {
    if (temp >= 50) return "#ff3d00"; // High temp (Red)
    if (temp >= 35) return "#ff9100"; // Medium temp (Orange)
    return "#00b0ff"; // Low temp (Blue)
  };

  // Check for alert conditions
  const currentPhLevel = phlevelData.length > 0 ? phlevelData[0]?.ph_level?.toFixed(2) || '7.35' : '7.35';
  const isPhLevelAlert = parseFloat(currentPhLevel) <= 4.0;

  const currentFeederLevel = feederData.length > 0 ? feederData[0]?.distance?.toFixed(2) || '5.05' : '5.05';
  const isFeederAlert = parseFloat(currentFeederLevel) >= 100.0;

  const currentDoLevel = doData.length > 0 ? doData[0]?.do_level?.toFixed(2) || '8.63' : '8.63';
  const isDoAlert = parseFloat(currentDoLevel) <= 4.0;

  const tempGaugeData = [
    { value: currentTemp, name: "Current Temperature" },
    { value: maxTemp - currentTemp, name: "Remaining" },
  ];

  // Custom Plant bar for hover effects
  const CustomPlantBar = (props) => {
    const { x, y, width, height, index, fill, dataKey } = props;
    const isActive = activeBarIndex === `${index}-${dataKey}`;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          rx={10}
          ry={10}
          className="plant-bar"
          style={{
            cursor: 'pointer',
            filter: isActive ? 'brightness(1.2) drop-shadow(0 0 6px rgba(0,0,0,0.3))' : 'none',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={() => setActiveBarIndex(`${index}-${dataKey}`)}
          onMouseLeave={() => setActiveBarIndex(null)}
        />
        {isActive && (
          <text
            x={x + width / 2}
            y={y - 10}
            fill="#333"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontWeight: 'bold', fontSize: '14px' }}
          >
            {`${props.payload[dataKey]} plants`}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
      </div>

      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="left-column">
          {/* Key Metrics */}
          <div className="key-metrics">
            <div className={`metric-card ph-card ${isPhLevelAlert ? 'alert' : ''}`}
              onClick={() => navigate('/phlevel')}
              style={{ cursor: 'pointer' }}
            >
              <div className="metric-title">pH Level</div>

              <div className="metric-value">pH: {currentPhLevel}</div>
              {isPhLevelAlert && <div className="alert-indicator">Low pH Alert</div>}
            </div>

            <div className={`metric-card feeder-card ${isFeederAlert ? 'alert' : ''}`}
              onClick={() => navigate('/food')}
              style={{ cursor: 'pointer' }}>

              <div className="metric-title">Feeder</div>
              <div className="metric-value">{currentFeederLevel} cm</div>
              {isFeederAlert && <div className="alert-indicator">High Level Alert</div>}
            </div>

            <div className={`metric-card oxygen-card ${isDoAlert ? 'alert' : ''}`}
              onClick={() => navigate('/do')}
              style={{ cursor: 'pointer' }}>
              <div className="metric-title">Dissolved Oxygen</div>

              <div className="metric-value">{currentDoLevel} mg/L</div>
              {isDoAlert && <div className="alert-indicator">Low O₂ Alert</div>}
            </div>
          </div>

          {/* Water Level Chart */}
          <div className="secondary-metrics">
            <div className="water-level-chart-container">
              <h3>Water Level</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={waterLevelChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Level']} />
                  <Bar
                    dataKey="value"
                    shape={(props) => <CustomWaterBar {...props} fill={props.payload.color} />}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="level-indicators">
                <span className="indicator high">High</span>
                <span className="indicator low">Low</span>
              </div>
            </div>

            {/* Water Temperature Card - Fixed Gauge */}
            <div className="water-temp-card"
              onClick={() => navigate('/watertemp')}
              style={{ cursor: 'pointer' }}
            >
              <h3>Water Temperature</h3>
              <div className="level-indicators">
                <span className="indicator high">High</span>
                <span className="indicator low">Low</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={tempGaugeData}
                    cx="50%"
                    cy="80%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill={getTempGaugeColor(currentTemp)} />
                    <Cell fill="#e0e0e0" /> {/* Background portion */}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}°C`, "Temperature"]} />
                  <text
                    x="50%"
                    y="75%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="temperature-text"
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      fill: getTempGaugeColor(currentTemp),
                    }}
                  >
                    {currentTemp}°C
                  </text>
                </PieChart>
              </ResponsiveContainer>
              <div className="temp-scale">
                <span style={{ left: "10%" }}>0°</span>
                <span style={{ left: "30%" }}>30°</span>
                <span style={{ left: "50%" }}>50°</span>
                <span style={{ left: "70%" }}>70°</span>
                <span style={{ left: "90%" }}>100°</span>
              </div>
            </div>
          </div>

          {/* Soil Moisture */}
          <div className="soil-moisture-card">
            <div className="soil-header">
              <h3>Soil Moisture</h3>
              <div className="level-indicators">
                <span className="indicator high2">High</span>
                <span className="indicator low">Low</span>
              </div>
            </div>
            <div className="moisture-table">
              <div className="table-header">
                <div className="col">#</div>
                <div className="col">Name</div>
                <div className="col moisture-col">Moisture Percent</div>
              </div>
              <div className="table-body">
                {soilMoistureData.map((item) => (
                  <div
                    key={item.id}
                    className="table-row"
                    onClick={() => handleNavigation(item.id)}
                    style={{ cursor: "pointer" }} // Indicates it's clickable
                  >
                    <div className="col">{item.id}</div>
                    <div className="col">{item.name}</div>
                    <div className="col moisture-col">
                      <div className="percent-bar-container">
                        <div
                          className={`percent-bar ${item.status}`}
                          style={{ width: `${item.percent}%` }}
                        ></div>
                        <div className="percent-bar-bg"></div>
                      </div>
                      <div className={`percent-value ${item.status}`}>
                        <span>{item.percent}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="right-column">
          {/* PPM Chart */}
          <div className="ppm-chart"
            onClick={() => navigate('/npk')}
            style={{ cursor: 'pointer' }}>
            <h3>Parts Per Million (NPK) </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ppmData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 150]} ticks={[0, 30, 60, 90, 120, 150]} />
                <Tooltip formatter={(value) => [`${value} ppm`, 'Concentration']} />
                <Bar
                  dataKey="value"
                  shape={<CustomPpmBar />}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Plants Planted By Week - Bar chart */}
          <div className="plants-chart">
            <div className="plants-header"
              onClick={() => navigate('/history')}
              style={{ cursor: 'pointer' }}>
              <h3>Total Plants Planted</h3>
              <div className="plants-legend">
                <div className="legend-item">
                  <span className="legend-color soil-based"></span>
                  <span>Soil-based</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color hydroponic"></span>
                  <span>Hydroponic</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={plantsByWeekData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }} barGap={10}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip formatter={(value, name) => [
                  `${value} plants`,
                  name === 'soilBased' ? 'Soil-based' : 'Hydroponic'
                ]} />
                <Bar
                  dataKey="soilBased"
                  name="Soil-based"
                  fill="#7CB342"
                  shape={props => <CustomPlantBar {...props} dataKey="soilBased" />}
                />
                <Bar
                  dataKey="hydroponic"
                  name="Hydroponic"
                  fill="#FFC107"
                  shape={props => <CustomPlantBar {...props} dataKey="hydroponic" />}
                />
              </BarChart>
            </ResponsiveContainer>
            <p>Hydroponics Plants: <span className="harvest-count">{totalPlants.hydroponic}</span></p>
            <p>Soil-Based Plants: <span className="harvest-count">{totalPlants.soilBased}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;