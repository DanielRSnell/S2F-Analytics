// Main entry point for the S2F Analytics Dashboard Web Component
import { AnalyticsDashboard } from './components/AnalyticsDashboard';

// Export the component class for programmatic use
export { AnalyticsDashboard };

// Export types for TypeScript users
export * from './types';

// Export data service for custom implementations
export { DataService } from './services/dataService';

// The component is automatically registered when this module is imported
// Usage: <s2f-analytics-dashboard s2fid="your-id"></s2f-analytics-dashboard>
