import { useEffect, useRef } from 'react';

export default function SupplyChainBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const createFloatingElement = (type: string) => {
      if (!containerRef.current) return;
      
      const element = document.createElement('div');
      element.className = `floating-element ${type}`;
      element.style.cssText = `
        position: absolute;
        opacity: 0.1;
        animation: float 20s infinite linear;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        transform: scale(${0.5 + Math.random() * 0.5});
        animation-delay: ${Math.random() * 20}s;
      `;
      
      // Add different icons based on type
      if (type === 'truck') {
        element.innerHTML = `
          <svg width="80" height="40" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 8h-3l-1.6-3.2A1 1 0 0 0 14.5 4H4a1 1 0 0 0-1 1v10a3 3 0 0 0 6 0h4a3 3 0 0 0 6 0h1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1zM6 17a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm10 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
        `;
      } else if (type === 'container') {
        element.innerHTML = `
          <svg width="60" height="60" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 6v12h20V6H2zm18 10H4V8h16v8zm-2-6H6v4h12v-4z"/>
          </svg>
        `;
      } else if (type === 'crane') {
        element.innerHTML = `
          <svg width="70" height="70" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        `;
      } else if (type === 'ship') {
        element.innerHTML = `
          <svg width="80" height="50" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 14.5L12 19l9-4.5v-4L12 15 3 10.5v4zM12 2L3 7l9 5 9-5-9-5z"/>
          </svg>
        `;
      }
      
      containerRef.current.appendChild(element);
      
      // Remove element after animation
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }, 20000);
    };

    // Create floating elements periodically
    const intervals = [
      setInterval(() => createFloatingElement('truck'), 3000),
      setInterval(() => createFloatingElement('container'), 4000),
      setInterval(() => createFloatingElement('crane'), 5000),
      setInterval(() => createFloatingElement('ship'), 6000),
    ];

    // Initial elements
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const types = ['truck', 'container', 'crane', 'ship'];
        createFloatingElement(types[Math.floor(Math.random() * types.length)]);
      }, i * 500);
    }

    return () => {
      intervals.forEach(clearInterval);
    };
  }, []);

  return (
    <>
      <div 
        ref={containerRef}
        className="fixed inset-0 overflow-hidden pointer-events-none z-0"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(37, 99, 235, 0.03) 0%, 
              rgba(59, 130, 246, 0.05) 25%,
              rgba(99, 102, 241, 0.03) 50%,
              rgba(139, 92, 246, 0.05) 75%,
              rgba(37, 99, 235, 0.03) 100%
            )
          `
        }}
      />
      
      {/* Animated grid pattern */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(37, 99, 235, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37, 99, 235, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          animation: 'gridMove 30s linear infinite'
        }}
      />


    </>
  );
}