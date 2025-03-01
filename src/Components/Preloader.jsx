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
              <span data-text-preloader="H" className="letters-loading">H</span>
              <span data-text-preloader="R" className="letters-loading">R</span>
              <span data-text-preloader="R" className="letters-loading">R</span>
              <span data-text-preloader="I" className="letters-loading">I</span>
              <span data-text-preloader="V" className="letters-loading">V</span>
              <span data-text-preloader="E" className="letters-loading">E</span>
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
            background: #f8f2e8; /* Updated to match the beige background */
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .loader-container {
            text-align: center;
          }

          .spinner {
            animation: spinner 1.5s infinite ease;
            border-radius: 50%;
            border: 4px solid rgba(66, 84, 244, 0.2); /* Lighter blue border */
            border-top-color: #4254f4; /* Main blue color from buttons */
            height: 120px;
            margin: 0 auto 45px auto;
            width: 120px;
          }

          .txt-loading {
            text-align: center;
            user-select: none;
            margin-bottom: 20px;
          }

          .letters-loading {
            color: rgba(66, 84, 244, 0.15); /* Very light blue */
            font-size: 60px;
            font-weight: 600;
            line-height: 70px;
            letter-spacing: 12px;
            display: inline-block;
            position: relative;
            -webkit-text-stroke-width: 0.3px;
            -webkit-text-stroke-color: rgba(66, 84, 244, 0.3);
            animation: wave-text 2s ease-in-out infinite;
          }

          .letters-loading:nth-child(1) { animation-delay: 0.0s; }
          .letters-loading:nth-child(2) { animation-delay: 0.1s; }
          .letters-loading:nth-child(3) { animation-delay: 0.2s; }
          .letters-loading:nth-child(4) { animation-delay: 0.3s; }
          .letters-loading:nth-child(5) { animation-delay: 0.4s; }
          .letters-loading:nth-child(6) { animation-delay: 0.5s; }

          .loading-progress {
            color: #4254f4; /* Main blue color */
            font-size: 24px;
            font-weight: 600;
            margin-top: 20px;
            position: relative;
          }

          .loading-progress:after {
            content: '';
            display: block;
            width: ${progress}%;
            height: 4px;
            background: #4254f4;
            border-radius: 4px;
            margin: 10px auto 0;
            transition: width 0.3s ease;
            max-width: 200px;
          }

          @keyframes spinner {
            0% {
              transform: rotateZ(0deg);
            }
            100% {
              transform: rotateZ(360deg);
            }
          }

          @keyframes wave-text {
            0% {
              transform: translateY(0);
            }
            20% {
              transform: translateY(-10px);
            }
            40% {
              transform: translateY(0);
            }
            100% {
              transform: translateY(0);
            }
          }

          @media screen and (max-width: 767px) {
            .spinner {
              height: 80px;
              width: 80px;
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