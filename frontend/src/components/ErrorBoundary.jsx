import { Component } from "react";
import { TbRefresh, TbHome } from "react-icons/tb";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="notfound-main">
        <div className="notfound-card">
          <div className="notfound-code">500</div>
          <div className="notfound-divider" />
          <h1 className="notfound-title">Something went wrong</h1>
          <p className="notfound-sub">
            An unexpected error occurred. Try refreshing the page — if it keeps
            happening, please let us know.
          </p>
          <div className="notfound-actions">
            <button
              className="notfound-btn-secondary"
              onClick={() => window.location.reload()}
            >
              <TbRefresh /> Refresh
            </button>
            <a href="/" className="notfound-btn-primary">
              <TbHome /> Go home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
