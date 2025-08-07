const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');

// 軽量化処理をインポート
const { simplifyDouglasPeucker, simplifyCoordinates } = require('../src/utils/geoSimplifier.js');

// ストリーミング処理用のTransformクラス
class GeoJSONSimplifier extends Transform {
  constructor(tolerance = 0.01) {
    super({ objectMode: true });
    this.tolerance = tolerance;
    this.features = [];
    this.prefectureGroups = {};
  }

  _transform(chunk, encoding, callback) {
    try {
      if (chunk.type === 'Feature') {
        const prefName = chunk.properties?.N03_001 || chunk.properties?.name;
        if (prefName) {
          if (!this.prefectureGroups[prefName]) {
            this.prefectureGroups[prefName] = [];
          }
          this.prefectureGroups[prefName].push(chunk);
        }
      }
      callback();
    } catch (error) {
      callback(error);
    }
  }

  _flush(callback) {
    try {
      // 都道府県ごとに結合して軽量化
      const simplifiedFeatures = Object.entries(this.prefectureGroups).map(([prefName, features]) => {
        // すべての座標を結合
        const allCoordinates = features.flatMap(feature => {
          if (feature.geometry.type === 'MultiPolygon') {
            return feature.geometry.coordinates;
          } else if (feature.geometry.type === 'Polygon') {
            return [feature.geometry.coordinates];
          }
          return [];
        });

        // 座標を簡略化
        const simplifiedCoordinates = allCoordinates.map(polygon => 
          polygon.map(ring => simplifyDouglasPeucker(ring, this.tolerance))
        );

        return {
          type: 'Feature',
          properties: {
            N03_001: prefName,
            name: prefName
          },
          geometry: {
            type: 'MultiPolygon',
            coordinates: simplifiedCoordinates
          }
        };
      });

      // 結果を出力
      this.push({
        type: 'FeatureCollection',
        features: simplifiedFeatures
      });

      callback();
    } catch (error) {
      callback(error);
    }
  }
}

async function simplifyGeoJSONFile() {
  try {
    console.log('GeoJSON軽量化処理を開始します...');
    
    const inputPath = path.join(__dirname, '../public/detail_prefectures.geojson');
    const outputPath = path.join(__dirname, '../public/simplified_prefectures.geojson');
    
    console.log(`入力ファイル: ${inputPath}`);
    console.log(`出力ファイル: ${outputPath}`);
    
    // ファイルサイズを確認
    const stats = fs.statSync(inputPath);
    console.log(`元のファイルサイズ: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // ストリーミング処理で軽量化
    const readStream = fs.createReadStream(inputPath, { encoding: 'utf8' });
    const writeStream = fs.createWriteStream(outputPath);
    const simplifier = new GeoJSONSimplifier(0.01);
    
    let data = '';
    readStream.on('data', chunk => {
      data += chunk;
    });
    
    readStream.on('end', () => {
      try {
        const geojson = JSON.parse(data);
        console.log(`フィーチャー数: ${geojson.features.length}`);
        
        // 軽量化処理
        const simplified = simplifier._flush(() => {
          const result = {
            type: 'FeatureCollection',
            features: Object.entries(simplifier.prefectureGroups).map(([prefName, features]) => {
              const allCoordinates = features.flatMap(feature => {
                if (feature.geometry.type === 'MultiPolygon') {
                  return feature.geometry.coordinates;
                } else if (feature.geometry.type === 'Polygon') {
                  return [feature.geometry.coordinates];
                }
                return [];
              });

              const simplifiedCoordinates = allCoordinates.map(polygon => 
                polygon.map(ring => simplifyDouglasPeucker(ring, 0.01))
              );

              return {
                type: 'Feature',
                properties: {
                  N03_001: prefName,
                  name: prefName
                },
                geometry: {
                  type: 'MultiPolygon',
                  coordinates: simplifiedCoordinates
                }
              };
            })
          };
          
          fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
          
          // 結果を確認
          const outputStats = fs.statSync(outputPath);
          console.log(`軽量化後のファイルサイズ: ${(outputStats.size / 1024 / 1024).toFixed(2)} MB`);
          console.log(`圧縮率: ${((1 - outputStats.size / stats.size) * 100).toFixed(2)}%`);
          console.log('軽量化処理が完了しました！');
        });
        
      } catch (error) {
        console.error('JSON解析エラー:', error);
      }
    });
    
    readStream.on('error', error => {
      console.error('読み込みエラー:', error);
    });
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// スクリプトを実行
simplifyGeoJSONFile();
