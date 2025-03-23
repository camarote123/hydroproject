import { CheckCircle, Droplet, Filter, Leaf, MapPin, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { supabase } from './createClient';
import './location.css';

const Location = ({ onLocationClick }) => {
  const [locations, setLocations] = useState([]);
  const [usedLocations, setUsedLocations] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        // Fetch locations from soil_locations and hydro_locations
        const { data: soilData, error: soilError } = await supabase.from("soil_locations").select("*");
        const { data: hydroData, error: hydroError } = await supabase.from("hydro_locations").select("*");
        const { data: regData, error: regError } = await supabase.from("registration").select("location");

        if (soilError || hydroError || regError) throw new Error(soilError?.message || hydroError?.message || regError?.message);

        // Add type identifier to each location
        const typedSoilData = soilData.map(loc => ({ ...loc, type: 'soil' }));
        const typedHydroData = hydroData.map(loc => ({ ...loc, type: 'hydro' }));
        
        // Combine soil and hydro locations
        const allLocations = [...typedSoilData, ...typedHydroData];
        setLocations(allLocations);

        // Extract used locations from the registration table
        const usedSet = new Set(regData.map((reg) => reg.location));
        setUsedLocations(usedSet);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchLocations();
  }, []);

  // Filter locations based on search term and type
  const filteredLocations = locations.filter(loc => {
    const matchesSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || loc.type === filterType;
    return matchesSearch && matchesType;
  });

  // Separate locations by type
  const soilLocations = filteredLocations.filter(loc => loc.type === 'soil');
  const hydroLocations = filteredLocations.filter(loc => loc.type === 'hydro');

  // Count stats
  const totalLocations = locations.length;
  const usedLocationCount = [...usedLocations].length;
  const availableLocationCount = totalLocations - usedLocationCount;

  // Handle location card click
  const handleLocationCardClick = (loc) => {
    // Only allow clicking available locations
    if (!usedLocations.has(loc.name) && onLocationClick) {
      onLocationClick(loc.name, loc.type);
    }
  };

  // Render location card
  const renderLocationCard = (loc) => {
    const isUsed = usedLocations.has(loc.name);
    return (
      <div
        key={loc.id}
        className={`location-card ${isUsed ? 'location-card-used' : 'location-card-available'}`}
        onClick={() => handleLocationCardClick(loc)}
        style={{ cursor: isUsed ? 'default' : 'pointer' }}
      >
        <div className="location-card-header">
          <h3 className={`location-name ${isUsed ? 'location-name-used' : 'location-name-available'}`}>
            {loc.name}
          </h3>
          {isUsed && (
            <CheckCircle className="text-white" size={18} />
          )}
        </div>
        <div className={`location-badge ${
          loc.type === 'soil' 
            ? isUsed ? 'soil-badge-used' : 'soil-badge-available' 
            : isUsed ? 'hydro-badge-used' : 'hydro-badge-available'
        }`}>
          {loc.type === 'soil' ? (
            <><Leaf size={12} className="inline mr-1" /> Soil</>
          ) : (
            <><Droplet size={12} className="inline mr-1" /> Hydro</>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="location-container">
      <div className="location-header">
        <h1 className="location-title">
          <MapPin className="mr-3 text-green-600" size={28} />
          Agricultural Plots
        </h1>
        <p className="location-subtitle">
          Select an available plot to add a new plant
        </p>
      </div>
      
      <div className="control-panel">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Find plots by name..."
            className="search-input w-full pl-10 pr-4 py-3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative min-w-48">
          <select
            className="filter-select w-full pl-10 pr-10 py-3"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="soil">Soil Only</option>
            <option value="hydro">Hydro Only</option>
          </select>
          <div className="absolute left-3 top-3 pointer-events-none">
            {filterType === "soil" ? (
              <Leaf className="text-green-600" size={18} />
            ) : filterType === "hydro" ? (
              <Droplet className="text-blue-600" size={18} />
            ) : (
              <Filter className="text-gray-500" size={18} />
            )}
          </div>
        </div>
      </div>
      
      <div className="stats-container">
        <div className="stats-card stats-total">
          <div className="stats-label">Total Plots</div>
          <div className="stats-value">{totalLocations}</div>
        </div>
        <div className="stats-card stats-used">
          <div className="stats-label">Active Plots</div>
          <div className="stats-value">{usedLocationCount}</div>
        </div>
        <div className="stats-card stats-available">
          <div className="stats-label">Available Plots</div>
          <div className="stats-value">{availableLocationCount}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <>
          {filteredLocations.length === 0 ? (
            <div className="empty-state">
              <p className="empty-message">No growing locations match your criteria</p>
            </div>
          ) : (
            <>
              {/* Soil Section */}
              {(filterType === "all" || filterType === "soil") && soilLocations.length > 0 && (
                <div className="locations-section soil-section">
                  <h2 className="section-title">
                    <Leaf size={18} className="text-green-700" />
                    Soil Plots
                  </h2>
                  <div className="locations-grid">
                    {soilLocations.map(renderLocationCard)}
                  </div>
                </div>
              )}
              
              {/* Hydro Section */}
              {(filterType === "all" || filterType === "hydro") && hydroLocations.length > 0 && (
                <div className="locations-section hydro-section">
                  <h2 className="section-title">
                    <Droplet size={18} className="text-blue-700" />
                    Hydroponic Systems
                  </h2>
                  <div className="locations-grid">
                    {hydroLocations.map(renderLocationCard)}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Location;