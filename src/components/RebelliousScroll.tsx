'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'

// カスタムスイッチコンポーネント
// プロップスとして id, checked 状態、onChange ハンドラ、ラベルテキストを受け取る
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
      className="sr-only" // アクセシビリティのために隠しつつ、機能は維持
    />
    {/* スイッチの外観をカスタマイズ */}
    <div className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}>
      <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'transform translate-x-6' : ''}`} />
    </div>
    <span className="ml-2">{label}</span>
  </label>
)

// イージング関数: スムーズなアニメーション効果のために使用
const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
}

export default function RebelliousScroll() {
  // 状態管理
  const [isRebellious, setIsRebellious] = useState(true) // 気まぐれモードの状態
  const [scrollPercentage, setScrollPercentage] = useState(0) // スクロール位置のパーセンテージ
  const [scrollBackSpeed, setScrollBackSpeed] = useState(5); // デフォルト速度は1

  // ref を使用してDOMとスクロール状態を追跡
  const contentRef = useRef<HTMLDivElement>(null) // スクロール可能なコンテンツへの参照
  const lastScrollTop = useRef(0) // 最後のスクロール位置
  const lastScrollTime = useRef(Date.now()) // 最後にスクロールした時間
  const scrolling = useRef(false) // スクロール中かどうかのフラグ
  const scrollBackInterval = useRef<NodeJS.Timeout | null>(null) // スクロールバック用のタイマー

  // ゆっくりと上にスクロールバックする関数
  const scrollBack = useCallback(() => {
    if (!contentRef.current || !isRebellious) return;
    
    const currentScrollTop = contentRef.current.scrollTop;
    if (currentScrollTop > 0) {
      // scrollBackSpeed に基づいてスクロール量を調整
      contentRef.current.scrollTop = Math.max(0, currentScrollTop - scrollBackSpeed);
      requestAnimationFrame(scrollBack); // 次のフレームで再度実行
    }
  }, [isRebellious, scrollBackSpeed]);

  // スクロールイベントハンドラ
  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const maxScrollTop = scrollHeight - clientHeight;
    const newScrollPercentage = (scrollTop / maxScrollTop) * 100;
    setScrollPercentage(newScrollPercentage); // スクロール位置のパーセンテージを更新

    if (!scrolling.current) {
      scrolling.current = true;
      requestAnimationFrame(() => {
        const currentTime = Date.now();
        const timeDelta = currentTime - lastScrollTime.current;
        const scrollDelta = scrollTop - lastScrollTop.current;
        const scrollSpeed = Math.abs(scrollDelta) / timeDelta;

        // 気まぐれモードがオンで下にスクロールしている場合
        if (isRebellious && scrollDelta > 0) {
          const rebellionStrength = Math.min(scrollSpeed * 10, 50); // スクロール速度に応じて反抗の強さを調整
          const targetScrollTop = Math.max(0, scrollTop - rebellionStrength);
          const distance = scrollTop - targetScrollTop;
          const duration = 300;
          let start: number | null = null;

          // スムーズなスクロールアニメーション
          const step = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const easeProgress = easeOutCubic(progress);
            if (contentRef.current) {
              contentRef.current.scrollTop = scrollTop - (distance * easeProgress);
            }
            if (progress < 1) {
              requestAnimationFrame(step);
            }
          };

          requestAnimationFrame(step);
        }

        lastScrollTop.current = contentRef.current!.scrollTop;
        lastScrollTime.current = currentTime;
        scrolling.current = false;

        // スクロールが停止したら、ゆっくりと上に戻るタイマーをセット
        if (scrollBackInterval.current) {
          clearTimeout(scrollBackInterval.current);
        }
        scrollBackInterval.current = setTimeout(() => {
          requestAnimationFrame(scrollBack);
        }, 0); // スクロールが停止してすぐ上に戻り始める
      });
    }
  }, [isRebellious, scrollBack]);

  // スクロールイベントリスナーの設定と解除
  useEffect(() => {
    const currentRef = contentRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
      if (scrollBackInterval.current) {
        clearTimeout(scrollBackInterval.current);
      }
    };
  }, [handleScroll]);

  return (
    <div className="h-screen flex flex-col font-sans bg-gray-100">
      <header className="p-4 border-b bg-white">
        <h1 className="text-2xl font-bold">気まぐれなスクロールウェブサイト</h1>
      </header>
      <main className="flex-1 overflow-hidden">
        {/* コントロールパネル */}
        <div className="flex flex-col gap-2 p-4 bg-white">
          <Switch
            id="rebellious-mode"
            checked={isRebellious}
            onChange={setIsRebellious}
            label={isRebellious ? '気まぐれモード: オン' : '気まぐれモード: オフ'}
          />
          {/* スクロール位置の表示（アクセシビリティのため aria-live 属性を使用） */}
          <div aria-live="polite" className="text-sm text-gray-600">
            スクロール位置: {scrollPercentage.toFixed(0)}%
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="scroll-speed" className="text-sm text-gray-600">
              スクロール戻り速度:
            </label>
            <input
              type="range"
              id="scroll-speed"
              min="0.1"
              max="5"
              step="0.1"
              value={scrollBackSpeed}
              onChange={(e) => setScrollBackSpeed(parseFloat(e.target.value))}
              className="w-32"
              aria-label="スクロール戻り速度の調整"
            />
            <span className="text-sm text-gray-600">{scrollBackSpeed.toFixed(1)}</span>
          </div>
        </div>
        {/* スクロール可能なコンテンツエリア */}
        <div
          ref={contentRef}
          className="h-[calc(100vh-12rem)] overflow-y-auto p-4 bg-white"
          role="region"
          aria-label="スクロール可能なコンテンツ"
        >
          <h2 className="text-xl font-semibold mb-4">コンテンツ</h2>
          {/* サンプルコンテンツの生成 */}
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i} className="mb-4 text-gray-700">
              これは段落 {i + 1} です。下にスクロールすると、
              {isRebellious ? '優しく上に動いて反抗したり、スクロールを止めるとゆっくりと上に戻ったりします。' : '通常通りスクロールします。'}
              このウェブサイトは、ユーザーの予想を少し裏切る動きをすることで、
              インタラクションデザインの新しい可能性を探ります。
            </p>
          ))}
        </div>
      </main>
      <footer className="p-4 border-t bg-white text-center text-sm text-gray-600">
        © 2024 気まぐれなスクロールウェブサイト
      </footer>
    </div>
  )
}