export default function GamePage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100dvh",
        overflow: "hidden",
        background: "#0d3b2e",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header minimo con pulsante back */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 16px",
          background: "rgba(0,0,0,0.3)",
          borderBottom: "1px solid rgba(45,168,106,0.2)",
          flexShrink: 0,
        }}
      >
        <a
          href="/"
          style={{
            color: "#f4a261",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ← RealMadrink
        </a>
        <span
          style={{
            marginLeft: "auto",
            color: "#2da86a",
            fontSize: "13px",
            fontWeight: "700",
            letterSpacing: "0.5px",
          }}
        >
          🎮 MODALITÀ ALLENATORE
        </span>
      </div>

      {/* Flutter App iframe */}
      <iframe
        src="/game/index.html"
        style={{
          flex: 1,
          width: "100%",
          border: "none",
          display: "block",
        }}
        title="RealMadrink FC - Championship Manager"
        allow="fullscreen"
      />
    </div>
  );
}
