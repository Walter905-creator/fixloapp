import React from "react";
import { BUILD_INFO } from "../buildInfo";

export default function Meta() {
  const buildData = {
    buildId: BUILD_INFO.BUILD_ID,
    commitSha: BUILD_INFO.COMMIT_SHA
  };

  return (
    <pre style={{ 
      padding: "2rem", 
      background: "#111", 
      color: "#0f0",
      fontFamily: "monospace",
      margin: 0,
      overflow: "auto"
    }}>
      {JSON.stringify(buildData, null, 2)}
    </pre>
  );
}