import React from "react";

export default class ProdErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state = { hasError:false, info:null }; }
  static getDerivedStateFromError(){ return { hasError:true }; }
  componentDidCatch(error, info){ console.error("[Fixlo ErrorBoundary]", error, info); this.setState({ info }); }
  render(){
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{padding:"24px", fontFamily:"system-ui, sans-serif"}}>
        <h1>We're fixing something.</h1>
        <p>If this persists, please refresh. (Error boundary caught a runtime error.)</p>
      </div>
    );
  }
}