import React, { useEffect, useState } from "react";

const DebugRoles: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedRoles = localStorage.getItem("roles");
    const storedAccessibleChapters = localStorage.getItem("RoleDC");

    const debug = {
      user: storedUser ? JSON.parse(storedUser) : null,
      roles: storedRoles ? JSON.parse(storedRoles) : null,
      accessibleChapters: storedAccessibleChapters
        ? JSON.parse(storedAccessibleChapters)
        : null,
    };

    setDebugInfo(debug);
    console.log("=== DEBUG ROLES INFO ===");
    console.log("User:", debug.user);
    console.log("Roles:", debug.roles);
    console.log("Accessible Chapters:", debug.accessibleChapters);
  }, []);

  if (!debugInfo) return <div>Loading debug info...</div>;

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        background: "white",
        border: "1px solid #ccc",
        padding: "10px",
        maxWidth: "400px",
        fontSize: "12px",
        zIndex: 9999,
      }}
    >
      <h3>Debug Roles Info</h3>
      <div>
        <strong>User:</strong>
        <pre>{JSON.stringify(debugInfo.user, null, 2)}</pre>
      </div>
      <div>
        <strong>Roles:</strong>
        <pre>{JSON.stringify(debugInfo.roles, null, 2)}</pre>
      </div>
      <div>
        <strong>Accessible Chapters:</strong>
        <pre>{JSON.stringify(debugInfo.accessibleChapters, null, 2)}</pre>
      </div>
    </div>
  );
};

export default DebugRoles;
