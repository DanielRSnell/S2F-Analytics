// Main entry point for the S2F Analytics Dashboard Web Component
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import variablesCSS from './styles/variables.css?raw';
import dashboardCSS from './styles/dashboard.css?raw';

// Auto-inject required CSS and scripts when this module loads
(function initializeDashboard() {
  // Inject CSS variables and dashboard styles into document head
  const styleElement = document.createElement('style');
  styleElement.id = 's2f-analytics-styles';
  styleElement.textContent = `
    ${variablesCSS}
    ${dashboardCSS}
  `;

  // Only inject if not already present
  if (!document.getElementById('s2f-analytics-styles')) {
    document.head.appendChild(styleElement);
  }

  // Inject Remix Icons
  const remixIconsLink = document.createElement('link');
  remixIconsLink.rel = 'stylesheet';
  remixIconsLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.6.0/remixicon.min.css';
  if (!document.querySelector('link[href*="remixicon"]')) {
    document.head.appendChild(remixIconsLink);
  }

  // Inject AG Grid CSS
  const agGridCSS = document.createElement('link');
  agGridCSS.rel = 'stylesheet';
  agGridCSS.href = 'https://cdn.jsdelivr.net/npm/ag-grid-community/dist/styles/ag-grid.css';
  if (!document.querySelector('link[href*="ag-grid.css"]')) {
    document.head.appendChild(agGridCSS);
  }

  const agThemeCSS = document.createElement('link');
  agThemeCSS.rel = 'stylesheet';
  agThemeCSS.href = 'https://cdn.jsdelivr.net/npm/ag-grid-community/dist/styles/ag-theme-alpine.css';
  if (!document.querySelector('link[href*="ag-theme-alpine"]')) {
    document.head.appendChild(agThemeCSS);
  }

  // Inject AG Grid Community library
  if (!(window as any).agGrid && !document.querySelector('script[src*="ag-grid-community"]')) {
    const agGridScript = document.createElement('script');
    agGridScript.src = 'https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js';
    agGridScript.async = false; // Load synchronously to ensure it's available
    document.head.appendChild(agGridScript);
  }
})();

// Export the component class for programmatic use
export { AnalyticsDashboard };

// Export types for TypeScript users
export * from './types';

// Export data service for custom implementations
export { DataService } from './services/dataService';

// The component is automatically registered when this module is imported
// Usage: <s2f-analytics-dashboard s2fid="your-id"></s2f-analytics-dashboard>
