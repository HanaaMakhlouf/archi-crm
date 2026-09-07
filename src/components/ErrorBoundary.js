import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>משהו השתבש</h2>
          <p>נסה לרענן את הדף. אם הבעיה ממשיכה, פנה לתמיכה.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            רענן דף
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
