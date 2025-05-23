import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Firestore Error:", error);
  }

  render() {
    if (this.state.hasError) {
      return <h2>Firestore permissions error. Refresh the page.</h2>;
    }
    return this.props.children;
  }
}
