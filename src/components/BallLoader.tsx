"use client";

export default function BallLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      <div className="ball-loader flex-shrink-0">
        <img
          src="/ball.svg"
          alt=""
          className="w-24 h-24 object-contain drop-shadow-xl"
        />
      </div>
      <p className="font-display font-semibold text-sport-white text-lg animate-pulse">
        Generazione squadre...
      </p>
    </div>
  );
}
