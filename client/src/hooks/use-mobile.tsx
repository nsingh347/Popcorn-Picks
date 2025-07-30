import { useState, useEffect } from 'react';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Check if mobile
      const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(mobile);
      
      // Check specific platforms
      setIsIOS(/iPad|iPhone|iPod/.test(userAgent));
      setIsAndroid(/Android/.test(userAgent));
    };

    checkMobile();
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', checkMobile);
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('orientationchange', checkMobile);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return { isMobile, isIOS, isAndroid };
}
