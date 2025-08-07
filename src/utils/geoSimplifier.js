// GeoJSON軽量化処理ユーティリティ

// 座標点の距離を計算する関数
const calculateDistance = (point1, point2) => {
  const dx = point1[0] - point2[0];
  const dy = point1[1] - point2[1];
  return Math.sqrt(dx * dx + dy * dy);
};

// 点から線分までの距離を計算する関数（Douglas-Peuckerアルゴリズム用）
const pointToLineDistance = (point, lineStart, lineEnd) => {
  const A = point[0] - lineStart[0];
  const B = point[1] - lineStart[1];
  const C = lineEnd[0] - lineStart[0];
  const D = lineEnd[1] - lineStart[1];

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) return calculateDistance(point, lineStart);
  
  let param = dot / lenSq;
  param = Math.max(0, Math.min(1, param));
  
  const x = lineStart[0] + param * C;
  const y = lineStart[1] + param * D;
  
  return calculateDistance(point, [x, y]);
};

// Douglas-Peuckerアルゴリズムで座標を簡略化
const simplifyDouglasPeucker = (coordinates, tolerance) => {
  if (coordinates.length <= 2) return coordinates;
  
  let maxDistance = 0;
  let maxIndex = 0;
  
  for (let i = 1; i < coordinates.length - 1; i++) {
    const distance = pointToLineDistance(
      coordinates[i],
      coordinates[0],
      coordinates[coordinates.length - 1]
    );
    
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }
  
  if (maxDistance > tolerance) {
    const firstLine = simplifyDouglasPeucker(
      coordinates.slice(0, maxIndex + 1),
      tolerance
    );
    const secondLine = simplifyDouglasPeucker(
      coordinates.slice(maxIndex),
      tolerance
    );
    
    return [...firstLine.slice(0, -1), ...secondLine];
  } else {
    return [coordinates[0], coordinates[coordinates.length - 1]];
  }
};

// 座標配列を簡略化する関数
const simplifyCoordinates = (coordinates, tolerance = 0.01) => {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return coordinates;
  }
  
  // 座標が配列の配列の場合（MultiPolygon）
  if (Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])) {
    return coordinates.map(polygon => 
      polygon.map(ring => simplifyDouglasPeucker(ring, tolerance))
    );
  }
  
  // 座標が配列の場合（Polygon）
  if (Array.isArray(coordinates[0]) && typeof coordinates[0][0] === 'number') {
    return coordinates.map(ring => simplifyDouglasPeucker(ring, tolerance));
  }
  
  // 単純な座標配列の場合（LineString）
  return simplifyDouglasPeucker(coordinates, tolerance);
};

// GeoJSONを軽量化するメイン関数
export const simplifyGeoJSON = (geojson, tolerance = 0.01) => {
  if (!geojson || !geojson.features) {
    console.error('Invalid GeoJSON format');
    return geojson;
  }
  
  const simplifiedFeatures = geojson.features.map(feature => {
    if (!feature.geometry || !feature.geometry.coordinates) {
      return feature;
    }
    
    const simplifiedCoordinates = simplifyCoordinates(
      feature.geometry.coordinates,
      tolerance
    );
    
    return {
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: simplifiedCoordinates
      }
    };
  });
  
  return {
    ...geojson,
    features: simplifiedFeatures
  };
};

// 都道府県ごとにデータを結合する関数（参考サイトのdissolve処理に相当）
export const dissolveByPrefecture = (geojson) => {
  if (!geojson || !geojson.features) {
    console.error('Invalid GeoJSON format');
    return geojson;
  }
  
  // 都道府県ごとにグループ化
  const prefectureGroups = {};
  
  geojson.features.forEach(feature => {
    const prefName = feature.properties?.N03_001 || feature.properties?.name;
    if (!prefName) return;
    
    if (!prefectureGroups[prefName]) {
      prefectureGroups[prefName] = [];
    }
    
    prefectureGroups[prefName].push(feature);
  });
  
  // 都道府県ごとに結合
  const dissolvedFeatures = Object.entries(prefectureGroups).map(([prefName, features]) => {
    // 最初のフィーチャーのプロパティをベースにする
    const baseProperties = features[0].properties;
    
    // すべての座標を結合
    const allCoordinates = features.flatMap(feature => {
      if (feature.geometry.type === 'MultiPolygon') {
        return feature.geometry.coordinates;
      } else if (feature.geometry.type === 'Polygon') {
        return [feature.geometry.coordinates];
      }
      return [];
    });
    
    return {
      type: 'Feature',
      properties: {
        N03_001: prefName,
        name: prefName
      },
      geometry: {
        type: 'MultiPolygon',
        coordinates: allCoordinates
      }
    };
  });
  
  return {
    type: 'FeatureCollection',
    features: dissolvedFeatures
  };
};

// 完全な軽量化処理
export const processGeoJSON = async (geojson, tolerance = 0.01) => {
  console.log('開始: GeoJSON軽量化処理');
  console.log(`元のフィーチャー数: ${geojson.features.length}`);
  
  // 1. 都道府県ごとに結合
  const dissolved = dissolveByPrefecture(geojson);
  console.log(`結合後のフィーチャー数: ${dissolved.features.length}`);
  
  // 2. 座標を簡略化
  const simplified = simplifyGeoJSON(dissolved, tolerance);
  console.log('完了: 座標簡略化');
  
  return simplified;
};
