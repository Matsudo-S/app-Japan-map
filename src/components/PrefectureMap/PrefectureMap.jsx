import React, { useState, useCallback, useEffect } from 'react';
import { loadAndProcessGeoJSON } from '../../utils/geojsonLoader';
import './PrefectureMap.css';

const PrefectureMap = ({ onPrefectureClick, onPrefectureHover, selectedPrefectures = [] }) => {
  const [hoveredPrefecture, setHoveredPrefecture] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [prefectureData, setPrefectureData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const handlePrefectureClick = useCallback((prefectureName) => {
    if (onPrefectureClick) {
      onPrefectureClick(prefectureName);
    }
  }, [onPrefectureClick]);

  const handlePrefectureMouseEnter = useCallback((prefectureName, event) => {
    setHoveredPrefecture(prefectureName);
    const rect = event.currentTarget.closest('.prefecture-map-wrapper').getBoundingClientRect();
    setTooltipPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
    if (onPrefectureHover) {
      onPrefectureHover(prefectureName);
    }
  }, [onPrefectureHover]);

  const handlePrefectureMouseLeave = useCallback(() => {
    setHoveredPrefecture(null);
    if (onPrefectureHover) {
      onPrefectureHover(null);
    }
  }, [onPrefectureHover]);

  // GeoJSONデータをロードする
  useEffect(() => {
    const loadMapData = async () => {
      try {
        const geoData = await loadAndProcessGeoJSON();
        if (geoData) {
          setPrefectureData(geoData);
        }
      } catch (error) {
        console.error('地図データの読み込みに失敗しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMapData();
  }, []);

  if (isLoading) {
    return (
      <div className="prefecture-map-container">
        <div className="prefecture-map-header">
          <h2>日本地図</h2>
          <div className="loading-message">地図データを読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="prefecture-map-container">
      <div className="prefecture-map-header">
        <h2>日本地図</h2>
      </div>
      
      <div className="prefecture-map-wrapper">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 450 500"
          className="prefecture-map-svg"
        >
          {Object.entries(prefectureData).map(([prefectureName, data]) => {
            const isSelected = selectedPrefectures.includes(prefectureName);
            const isHovered = hoveredPrefecture === prefectureName;
            
            let fillColor = data.color;
            if (isHovered) {
              fillColor = '#ff6b6b';
            } else if (isSelected) {
              fillColor = '#6c5ce7';
            }
            
            return (
              <path
                key={data.id}
                d={data.path}
                fill={fillColor}
                stroke="#ffffff"
                strokeWidth={isSelected ? "2" : "1"}
                className={`prefecture-path ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
                onMouseEnter={(event) => handlePrefectureMouseEnter(prefectureName, event)}
                onMouseLeave={handlePrefectureMouseLeave}
                onClick={() => handlePrefectureClick(prefectureName)}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out'
                }}
              />
            );
          })}
          
          {/* 沖縄の接続線と枠（都道府県の後に描画） */}
          <g className="okinawa-connection">
            {/* 実際の沖縄位置（九州南西）から千葉県右側への接続線 */}
            <line
              x1="150" y1="380"
              x2="420" y2="260"
              stroke="#666666"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            
            {/* 沖縄別枠の境界 */}
            <rect
              x="410" y="250"
              width="55" height="40"
              fill="none"
              stroke="#666666"
              strokeWidth="2"
              strokeDasharray="3,3"
              rx="5"
            />
            
            {/* 沖縄ラベル */}
            <text
              x="437" y="243"
              textAnchor="middle"
              fontSize="10"
              fill="#666666"
              fontWeight="bold"
            >
              沖縄県
            </text>
          </g>
        </svg>
        
        {/* 吹き出しツールチップ */}
        {hoveredPrefecture && (
          <div 
            className="prefecture-tooltip"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y - 10
            }}
          >
            <div className="tooltip-content">
              {hoveredPrefecture}
            </div>
            <div className="tooltip-arrow"></div>
          </div>
        )}
      </div>

      <div className="prefecture-legend">
        <h3>地域別色分け</h3>
        <div className="legend-grid">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#8AA624' }}></div>
            <span>北海道</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#DBE4C9' }}></div>
            <span>東北</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#FFFFF0' }}></div>
            <span>関東</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#FEA405' }}></div>
            <span>中部</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#8AA624' }}></div>
            <span>関西</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#DBE4C9' }}></div>
            <span>中国</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#FFFFF0' }}></div>
            <span>四国</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#FEA405' }}></div>
            <span>九州</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#8AA624' }}></div>
            <span>沖縄</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrefectureMap;