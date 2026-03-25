import React, { useMemo } from "react";
import "./AuthLayout.css";

const AuthLayout = ({ children }) => {
  // Generamos las partículas una sola vez
  const particles = useMemo(() => {
    return Array.from({ length: 400 }).map((_, i) => (
      <div
        key={i}
        className="particle"
        style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 10}s`,
          animationDuration: `${8 + Math.random() * 6}s`,
        }}
      />
    ));
  }, []);

  return (
    <div className="auth-background">
      {/* Reflejo solar superior */}
      <div className="sun-glare"></div>

      {/* Círculos decorativos */}
      <div className="decorative-circle circle1"></div>
      <div className="decorative-circle circle2"></div>
      <div className="decorative-circle circle3"></div>

      {/* Capa de partículas */}
      <div className="particles-container">{particles}</div>

      {/* Contenedor del formulario (Login o Register) */}
      <div className="auth-content">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;