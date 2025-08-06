import React, { useState, useCallback } from 'react'
import PrefectureMap from '../PrefectureMap/PrefectureMap'
import "./Home.css"

export const Home = () => {
  const [selectedPrefectures, setSelectedPrefectures] = useState([]);

  const handlePrefectureClick = useCallback((prefectureName) => {
    setSelectedPrefectures(prev => {
      // 既に選択されている場合は選択を解除
      if (prev.includes(prefectureName)) {
        console.log(`選択解除された都道府県: ${prefectureName}`);
        return prev.filter(name => name !== prefectureName);
      } else {
        // 新規選択
        console.log(`選択された都道府県: ${prefectureName}`);
        return [...prev, prefectureName];
      }
    });
  }, []);

  const handlePrefectureHover = useCallback((prefectureName) => {
    // ホバー時の処理（必要に応じて実装）
  }, []);

  return (
    <div className='home'>
      <div className='home__inner'>
        <div className='home__header'>
          <div className='home__header__title'>
            <h1>日本の都道府県マップ</h1>
            <p>各都道府県をクリックして詳細を表示</p>  
          </div>
          {/* カテゴリーボックス */}
          <div className='category-box'>
            <div className='category-box__header'>
              <h3>選択した都道府県 ({selectedPrefectures.length})</h3>
              {selectedPrefectures.length > 0 && (
                <button 
                  className='clear-all-button'
                  onClick={() => setSelectedPrefectures([])}
                >
                  すべて削除
                </button>
              )}
            </div>
            <div className='category-box__content'>
              {selectedPrefectures.length > 0 ? (
                <div className='category-items-container'>
                  {selectedPrefectures.map((prefecture) => (
                    <div key={prefecture} className='category-item'>
                      <span className='category-item__name'>{prefecture}</span>
                      <button 
                        className='category-item__remove'
                        onClick={() => setSelectedPrefectures(prev => 
                          prev.filter(name => name !== prefecture)
                        )}
                        aria-label={`${prefecture}の選択を解除`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='category-box__placeholder'>
                  都道府県を選択してください（複数選択可能）
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className='home__mapContainer'>
          <PrefectureMap 
            onPrefectureClick={handlePrefectureClick}
            onPrefectureHover={handlePrefectureHover}
            selectedPrefectures={selectedPrefectures}
          />
        </div>
      </div>
    </div>
  )
}

export default Home;