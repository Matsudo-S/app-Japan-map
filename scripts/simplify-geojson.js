const fs = require('fs');
const path = require('path');

// 軽量化処理をインポート
const { processGeoJSON } = require('../src/utils/geoSimplifier.js');

async function simplifyGeoJSONFile() {
  try {
    console.log('GeoJSON軽量化処理を開始します...');
    
    // 詳細なGeoJSONファイルを読み込み
    const inputPath = path.join(__dirname, '../public/detail_prefectures.geojson');
    const outputPath = path.join(__dirname, '../public/simplified_prefectures.geojson');
    
    console.log(`入力ファイル: ${inputPath}`);
    console.log(`出力ファイル: ${outputPath}`);
    
    // ファイルサイズを確認
    const stats = fs.statSync(inputPath);
    console.log(`元のファイルサイズ: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // GeoJSONファイルを読み込み
    const geojsonData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    
    // 軽量化処理を実行
    const simplifiedData = await processGeoJSON(geojsonData, 0.01);
    
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
simplifyGeoJSONFile();
