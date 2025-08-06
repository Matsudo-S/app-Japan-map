// GeoJSONデータを処理するユーティリティ

// 緯度経度からSVG座標に変換する関数
export const convertLatLngToSVG = (lng, lat, bounds, svgWidth = 450, svgHeight = 500, prefName = '') => {
  // 沖縄の位置を特別に調整（接続線と枠と同じ位置に配置）
  if (prefName === '沖縄県') {
    // 接続線と枠と同じ位置に配置（利便性のため）
    const okinawaX = 380; // 枠のX位置と同じ（450×500に合わせて調整）
    const okinawaY = 250; // 枠のY位置と同じ
    
    // 沖縄内での相対位置を計算（縮小スケール）
    const okinawaScale = 0.15;
    const relativeX = ((lng - 123.0) / (131.0 - 123.0)) * 40 * okinawaScale;
    const relativeY = ((27.0 - lat) / (27.0 - 24.0)) * 30 * okinawaScale;
    
    return { 
      x: okinawaX + relativeX, 
      y: okinawaY + relativeY 
    };
  }
  
  // 他の都道府県は通常の変換
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * svgWidth;
  const y = svgHeight - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * svgHeight;
  
  // デバッグ用：九州エリアの座標を確認
  if (prefName && ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県'].includes(prefName)) {
    console.log(`${prefName}: lng=${lng}, lat=${lat}, x=${x}, y=${y}`);
  }
  
  return { x, y };
};

// GeoJSONの座標配列をSVGパスに変換する関数
export const coordinatesToSVGPath = (coordinates, bounds, prefName = '') => {
  if (!coordinates || coordinates.length === 0) return '';
  
  let path = '';
  
  // MultiPolygonの場合、最初のPolygonを使用
  const polygons = coordinates[0] || coordinates;
  
  if (Array.isArray(polygons[0]) && Array.isArray(polygons[0][0])) {
    // 複数のリングがある場合、外側のリングのみを使用
    const outerRing = polygons[0];
    
    // デバッグ用：九州エリアの座標数を確認
    if (['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県'].includes(prefName)) {
      console.log(`${prefName} coordinates count:`, outerRing.length);
    }
    
    outerRing.forEach((coord, index) => {
      const [lng, lat] = coord;
      const { x, y } = convertLatLngToSVG(lng, lat, bounds, 450, 500, prefName);
      
      if (index === 0) {
        path += `M${x.toFixed(2)},${y.toFixed(2)}`;
      } else {
        path += ` L${x.toFixed(2)},${y.toFixed(2)}`;
      }
    });
    
    path += ' Z';
  }
  
  return path;
};

// 日本全体の緯度経度の境界を取得
export const getJapanBounds = () => ({
  minLat: 24.0,
  maxLat: 46.0,
  minLng: 123.0,
  maxLng: 146.0
});

// GeoJSONファイルをロードして処理する関数
export const loadAndProcessGeoJSON = async () => {
  try {
    const response = await fetch('/prefectures.geojson');
    const geojsonData = await response.json();
    
    const bounds = getJapanBounds();
    const processedData = {};
    
    geojsonData.features.forEach(feature => {
      const prefName = feature.properties.name;
      const coordinates = feature.geometry.coordinates;
      
      const svgPath = coordinatesToSVGPath(coordinates, bounds, prefName);
      
      // デバッグ用：九州エリアのSVGパスを確認
      if (['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県'].includes(prefName)) {
        console.log(`${prefName} SVG Path:`, svgPath);
      }
      
      processedData[prefName] = {
        id: feature.properties.name.toLowerCase().replace(/[県府都道]/g, ''),
        name: prefName,
        path: svgPath,
        color: getColorForPrefecture(prefName)
      };
    });
    
    return processedData;
  } catch (error) {
    console.error('GeoJSONファイルの読み込みに失敗しました:', error);
    return null;
  }
};

// 都道府県に応じた色を設定する関数
const getColorForPrefecture = (prefName) => {
  // 地方単位での色分け（地域別色分けと同じ）
  const regionColorMap = {
    // 北海道 - #8AA624
    '北海道': '#8AA624',
    
    // 東北 - #DBE4C9
    '青森県': '#DBE4C9',
    '岩手県': '#DBE4C9',
    '宮城県': '#DBE4C9',
    '秋田県': '#DBE4C9',
    '山形県': '#DBE4C9',
    '福島県': '#DBE4C9',
    
    // 関東 - #FFFFF0
    '茨城県': '#FFFFF0',
    '栃木県': '#FFFFF0',
    '群馬県': '#FFFFF0',
    '埼玉県': '#FFFFF0',
    '千葉県': '#FFFFF0',
    '東京都': '#FFFFF0',
    '神奈川県': '#FFFFF0',
    
    // 中部 - #FEA405
    '新潟県': '#FEA405',
    '富山県': '#FEA405',
    '石川県': '#FEA405',
    '福井県': '#FEA405',
    '山梨県': '#FEA405',
    '長野県': '#FEA405',
    '岐阜県': '#FEA405',
    '静岡県': '#FEA405',
    '愛知県': '#FEA405',
    
    // 関西 - #8AA624
    '三重県': '#8AA624',
    '滋賀県': '#8AA624',
    '京都府': '#8AA624',
    '大阪府': '#8AA624',
    '兵庫県': '#8AA624',
    '奈良県': '#8AA624',
    '和歌山県': '#8AA624',
    
    // 中国 - #DBE4C9
    '鳥取県': '#DBE4C9',
    '島根県': '#DBE4C9',
    '岡山県': '#DBE4C9',
    '広島県': '#DBE4C9',
    '山口県': '#DBE4C9',
    
    // 四国 - #FFFFF0
    '徳島県': '#FFFFF0',
    '香川県': '#FFFFF0',
    '愛媛県': '#FFFFF0',
    '高知県': '#FFFFF0',
    
    // 九州 - #FEA405
    '福岡県': '#FEA405',
    '佐賀県': '#FEA405',
    '長崎県': '#FEA405',
    '熊本県': '#FEA405',
    '大分県': '#FEA405',
    '宮崎県': '#FEA405',
    '鹿児島県': '#FEA405',
    
    // 沖縄 - #8AA624
    '沖縄県': '#8AA624'
  };
  
  return regionColorMap[prefName] || '#8AA624';
};