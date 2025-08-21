import { useEffect, useState } from "react";

export default function useExitIntent() {
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e) => {
      // Only trigger if mouse is leaving from the top of the page
      if (e.clientY <= 0 && !hasShown) {
        setShowExitIntent(true);
        setHasShown(true);
      }
    };

    const handleKeyDown = (e) => {
      // Close modal on escape
      if (e.key === "Escape" && showExitIntent) {
        setShowExitIntent(false);
      }
    };

    // Add event listeners
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasShown, showExitIntent]);

  const closeModal = () => {
    setShowExitIntent(false);
  };

  return {
    showExitIntent,
    closeModal
  };
}