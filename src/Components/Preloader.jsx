import React, { useState, useEffect } from 'react';

const Preloader = ({ images, children }) => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const totalImages = images?.length || 0;

  useEffect(() => {
    let loadedImages = 0;

    const loadImage = (url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          loadedImages++;
          // Calculate percentage and ensure it doesn't exceed 100
          const percentage = Math.min(Math.round((loadedImages / totalImages) * 100), 100);
          setProgress(percentage);
          resolve();
        };
        img.onerror = () => {
          loadedImages++;
          const percentage = Math.min(Math.round((loadedImages / totalImages) * 100), 100);
          setProgress(percentage);
          // Still resolve on error to continue loading
          resolve();
        };
      });
    };

    const preloadImages = async () => {
      try {
        // Start with initial progress
        setProgress(0);
        
        // Load all images concurrently
        await Promise.all(images.map(url => loadImage(url)));
        
        // Ensure we set 100% when complete
        setProgress(100);
        
        // Add small delay before hiding loader
        setTimeout(() => setLoading(false), 500);
      } catch (error) {
        console.error('Error preloading images:', error);
        setLoading(false);
      }
    };

    if (images && images.length > 0) {
      preloadImages();
    } else {
      setLoading(false);
    }
  }, [images, totalImages]);

  if (loading) {
    return (
      <div className="preloader-wrapper">
        <div className="loader-container">
          <div className="animation-preloader">
            <div className="spinner"></div>
            <div className="txt-loading">
              <span data-text-preloader="l" className="letters-loading">l</span>
              <span data-text-preloader="o" className="letters-loading">o</span>
              <span data-text-preloader="a" className="letters-loading">a</span>
              <span data-text-preloader="d" className="letters-loading">d</span>
              <span data-text-preloader="i" className="letters-loading">i</span>
              <span data-text-preloader="n" className="letters-loading">n</span>
              <span data-text-preloader="g" className="letters-loading">g</span>
            </div>
            <div className="loading-progress">
              {progress}%
            </div>
          </div>
        </div>
        <style jsx>{`
          .preloader-wrapper {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            background: #03081C;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .loader-container {
            text-align: center;
          }

          .spinner {
            animation: spinner 1s infinite linear;
            border-radius: 50%;
            border: 3px solid #ffffff;
            border-top-color: rgba(255, 255, 255, 0.2);
            height: 150px;
            margin: 0 auto 45px auto;
            width: 150px;
          }

          .txt-loading {
            text-align: center;
            user-select: none;
            margin-bottom: 20px;
          }

          .letters-loading {
            color: rgba(255, 255, 255, 0.15);
            font-size: 70px;
            line-height: 70px;
            letter-spacing: 10px;
            display: inline-block;
            position: relative;
            -webkit-text-stroke-width: 0.3px;
            -webkit-text-stroke-color: rgba(255, 255, 255, 0.3);
          }

          .loading-progress {
            color: #ffffff;
            font-size: 24px;
            font-weight: 500;
          }

          @keyframes spinner {
            to {
              transform: rotateZ(360deg);
            }
          }

          @media screen and (max-width: 767px) {
            .spinner {
              height: 8em;
              width: 8em;
            }
            .letters-loading {
              font-size: 40px;
              letter-spacing: 8px;
            }
          }
        `}</style>
      </div>
    );
  }

  return children;
};

export default Preloader;