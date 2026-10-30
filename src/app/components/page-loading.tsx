import Image from 'next/image';

export default function PageLoading() {
  return (
    <div className="moa-page-loading" role="status" aria-live="polite">
      <div className="moa-loading-media" aria-hidden="true">
        <video
          className="moa-loading-video"
          src="/moa-loading.mp4"
          poster="/moa-loading-poster.png"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <Image
          className="moa-loading-still"
          src="/moa-loading-poster.png"
          alt=""
          width={640}
          height={360}
          unoptimized
        />
      </div>
      <p>나의 활동을 불러오고 있어요…</p>
    </div>
  );
}
