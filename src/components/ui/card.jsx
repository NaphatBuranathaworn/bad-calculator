export function Card({ children }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        backgroundColor: "#fff",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      {children}
    </div>
  );
}

export function CardContent({ children }) {
  return <div style={{ marginTop: "8px" }}>{children}</div>;
}
