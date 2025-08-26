import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import ProSignupForm from "./ProSignupForm";

export default function ExitIntentModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("xit-dismissed");
    if (dismissed) return;
    function onLeave(e) {
      if (e.clientY <= 0) {
        setOpen(true);
        localStorage.setItem("xit-dismissed", "1");
      }
    }
    window.addEventListener("mouseout", onLeave);
    return () => window.removeEventListener("mouseout", onLeave);
  }, []);

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Leaving already?">
      <p style={{marginTop:0, color:"#334155"}}>
        Homeowners are waiting for professionals like you to help with their projects!
      </p>
      <ProSignupForm onSubmitted={() => {}} />
    </Modal>
  );
}
