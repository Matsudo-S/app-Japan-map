const fs = require('fs');
const path = require('path');

// Douglas-Peuckerアルゴリズムの実装
function simplifyDouglasPeucker(points, tolerance) {
  if (points.length <= 2) return points;
  
  let maxDistance = 0;
  let maxIndex = 0;
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = pointToLineDistance(points[i], points[0], points[points.length - 1]);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }
  
  if (maxDistance > tolerance) {
    const firstLine = simplifyDouglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const secondLine = simplifyDouglasPeucker(points.slice(maxIndex), tolerance);
    return [...firstLine.slice(0, -1), ...secondLine];
  } else {
    return [points[0], points[points.length - 1]];
  }
}

function pointToLineDistance(point, lineStart, lineEnd) {
  const A = point[0] - lineStart[0];
  const B = point[1] - lineStart[1];
  const C = lineEnd[0] - lineStart[0];
  const D = lineEnd[1] - lineStart[1];
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) return Math.sqrt(A * A + B * B);
  
  let param = dot / lenSq;
  param = Math.max(0, Math.min(1, param));
  
  const x = lineStart[0] + param * C;
  const y = lineStart[1] + param * D;
  
  return Math.sqrt((point[0] - x) * (point[0] - x) + (point[1] - y) * (point[1] - y));
}

// 座標配列を簡略化
function simplifyCoordinates(coordinates, tolerance = 0.01) {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return coordinates;
  }
  
  // MultiPolygonの場合
  if (Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])) {
    return coordinates.map(polygon => 
      polygon.map(ring => simplifyDouglasPeucker(ring, tolerance))
    );
  }
  
  // Polygonの場合
  if (Array.isArray(coordinates[0]) && typeof coordinates[0][0] === 'number') {
    return coordinates.map(ring => simplifyDouglasPeucker(ring, tolerance));
  }
  
  // LineStringの場合
  return simplifyDouglasPeucker(coordinates, tolerance);
}

// GeoJSONを軽量化
function simplifyGeoJSON(geojson, tolerance = 0.01) {
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
}

// メイン処理
async function main() {
  try {
    console.log('効率的なGeoJSON軽量化処理を開始します...');
    
    const inputPath = path.join(__dirname, '../public/prefectures.geojson');
    const outputPath = path.join(__dirname, '../public/optimized_prefectures.geojson');
    
    console.log(`入力ファイル: ${inputPath}`);
    console.log(`出力ファイル: ${outputPath}`);
    
    // ファイルサイズを確認
    const stats = fs.statSync(inputPath);
    console.log(`元のファイルサイズ: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // GeoJSONファイルを読み込み
    const geojsonData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    console.log(`フィーチャー数: ${geojsonData.features.length}`);
    
    // 軽量化処理を実行
    const simplifiedData = simplifyGeoJSON(geojsonData, 0.005); // より厳密な軽量化
    
    // 軽量化されたデータを保存
    fs.writeFileSync(outputPath, JSON.stringify(simplifiedData, null, 2));
    
    // 結果を確認
    const outputStats = fs.statSync(outputPath);
    console.log(`軽量化後のファイルサイズ: ${(outputStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`圧縮率: ${((1 - outputStats.size / stats.size) * 100).toFixed(2)}%`);
    
    console.log('軽量化処理が完了しました！');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// スクリプトを実行
main();
