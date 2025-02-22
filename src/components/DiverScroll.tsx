import React, { useEffect, useState, useRef, useCallback } from "react";
import diverimg from "../assets/diver.png";
import sakana1 from "../assets/sakana1.png";
import sakana2 from "../assets/sakana2.png";
import sakana3 from "../assets/sakana3.png";
import sakana4 from "../assets/sakana4.png";
import shinkai1 from "../assets/shinkai1.png";
import shinkai2 from "../assets/shinkai2.png";
import shinkai3 from "../assets/shinkai3.png";

{/* スイッチコンポーネント */}
const Switch: React.FC<{
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}> = ({ id, checked, onChange, label }) => (
  <label htmlFor={id} className="flex items-center cursor-pointer">
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only"
    />
    <div
      className={`relative w-12 h-6 rounded-full transition-colors ${
        checked ? "bg-blue-500" : "bg-gray-300"
      }`}
    >
      <div
        className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? "transform translate-x-6" : ""
        }`}
      />
    </div>
    <span className="ml-2">{label}</span>
  </label>
);

export default function DiverScroll() {
  {/* State管理 */}
  const [isUnderwater, setIsUnderwater] = useState(true);
  const [depth, setDepth] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrolling = useRef(false);
  const lastTouchY = useRef<number | null>(null);
  const buoyancyInterval = useRef<NodeJS.Timeout | null>(null);

  {/* 浮力効果の適用 */}
  const applyBuoyancy = useCallback(() => {
    if (!contentRef.current || !isUnderwater) return;

    const currentScrollTop = contentRef.current.scrollTop;
    if (currentScrollTop > 0) {
      contentRef.current.scrollTop = Math.max(
        0,
        currentScrollTop - 8
      );
      requestAnimationFrame(applyBuoyancy);
    }
  }, [isUnderwater]);

  {/* スクロールハンドラー */}
  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const maxScrollTop = scrollHeight - clientHeight;
    const newDepth = (scrollTop / maxScrollTop) * 100;
    setDepth(newDepth);

    // スクロール抵抗を強化
    if (!scrolling.current) {
      scrolling.current = true;
      requestAnimationFrame(() => {
        if (isUnderwater) {
          const resistance = Math.min(newDepth * 0.5, 20);
          if (contentRef.current) {
            contentRef.current.scrollTop = Math.max(
              0,
              scrollTop - resistance
            );
          }
        }

        if (buoyancyInterval.current) {
          clearTimeout(buoyancyInterval.current);
        }
        buoyancyInterval.current = setTimeout(() => {
          requestAnimationFrame(applyBuoyancy);
        }, 50);

        scrolling.current = false;
      });
    }
  }, [isUnderwater, applyBuoyancy]);

  {/* スクロールイベントリスナーの設定 */}
  useEffect(() => {
    const currentRef = contentRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", handleScroll);
      }
      if (buoyancyInterval.current) {
        clearTimeout(buoyancyInterval.current);
      }
    };
  }, [handleScroll]);

  {/* 魚の配置データを生成 */}
  const generateFishPositions = () => {
    const positions = [];
    
    // 浅い深度の魚（0-2500m）
    const shallowFish = [sakana1, sakana2, sakana3, sakana4];
    for (let i = 0; i < 12; i++) {
      positions.push({
        image: shallowFish[Math.floor(Math.random() * shallowFish.length)],
        depth: Math.random() * 2500,
        x: Math.random() * 80 + 10,
        size: Math.random() * 50 + 80,
        flip: Math.random() > 0.5,
      });
    }
    
    // 深海魚（2500-11500m）
    const deepFish = [shinkai1, shinkai2, shinkai3];
    for (let i = 0; i < 15; i++) {
      positions.push({
        image: deepFish[Math.floor(Math.random() * deepFish.length)],
        depth: Math.random() * 9000 + 2500,
        x: Math.random() * 80 + 10,
        size: Math.random() * 60 + 100,
        flip: Math.random() > 0.5,
      });
    }
    
    return positions.sort((a, b) => a.depth - b.depth);
  };

  const fishPositions = React.useMemo(() => generateFishPositions(), []);

  return (
    <div className="h-screen flex flex-col font-sans bg-blue-50 relative">
      {/* コントロールパネル */}
      <div className="fixed top-4 right-4 flex flex-col gap-2 bg-white/80 p-4 rounded-lg shadow-lg z-20">
        <Switch
          id="underwater-mode"
          checked={isUnderwater}
          onChange={setIsUnderwater}
          label={isUnderwater ? '水中モード: オン' : '水中モード: オフ'}
        />
      </div>

      {/* 潜水士 */}
      <div 
        className="fixed left-1/2 transform -translate-x-1/2 z-10"
        style={{ 
          top: '80px',
          transform: `translate(-50%, 0) rotate(${depth > 50 ? 180 : 0}deg)`,
        }}
      >
        <img
          src={diverimg}
          alt="潜水士"
          style={{ 
            width: 'auto',
            height: '100px'
          }}
        />
      </div>

      {/* スクロール可能なコンテンツエリア */}
      <div
        ref={contentRef}
        className="h-screen overflow-y-auto scrollbar-hide"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          overscrollBehavior: 'none',
          touchAction: 'pan-y pinch-zoom',
        }}
        onTouchStart={() => {
          lastTouchY.current = null;
        }}
        onTouchMove={(e) => {
          if (isUnderwater) {
            const touch = e.touches[0];
            const moveSpeed = Math.abs(touch.clientY - (lastTouchY.current || touch.clientY));
            
            if (moveSpeed > 30) {
              e.preventDefault();
            }
            
            lastTouchY.current = touch.clientY;
          }
        }}
        role="region"
        aria-label="スクロール可能なコンテンツ領域"
      >
        {/* メインコンテンツ */}
        <div 
          className="min-h-[1200vh] flex flex-col items-center justify-start pt-40 space-y-96 relative"
          style={{
            background: 'linear-gradient(180deg, #B5E7FF 0%, #87CEEB 10%, #3B82F6 30%, #1E40AF 50%, #1E3A8A 70%, #172554 80%, #0A1128 90%, #050A18 95%, #000033 100%)',
            paddingBottom: '100vh'
          }}
        >
          {/* 魚の配置 */}
          {fishPositions.map((fish, index) => (
            <div
              key={index}
              className="absolute will-change-transform"
              style={{
                left: `${fish.x}%`,
                top: `${(fish.depth / 12000) * 100}%`,
                transform: `scaleX(${fish.flip ? -1 : 1})`,
              }}
            >
              <img
                src={fish.image}
                alt="魚"
                className="transform-gpu"
                style={{
                  width: `${fish.size}px`,
                  height: 'auto',
                  opacity: 0.8,
                }}
                loading="eager"
              />
            </div>
          ))}

          {/* 深度表示 */}
          <div className="text-2xl text-white">↓ スクロールして深海へ ↓</div>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="text-white/70 text-xl">
              深度 {i * 500}m
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
