/**
 * Lazy-loaded Chart Components
 * Defers loading 390KB recharts library until actually needed
 * OptiMax Optimization: Saves ~100KB from initial bundle
 */

import { lazy, Suspense, ComponentType } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load the entire recharts library
const RechartsComponents = lazy(() => 
  import("recharts").then(module => ({
    default: {
      BarChart: module.BarChart,
      PieChart: module.PieChart,
      LineChart: module.LineChart,
      AreaChart: module.AreaChart,
      Bar: module.Bar,
      Pie: module.Pie,
      Line: module.Line,
      Area: module.Area,
      XAxis: module.XAxis,
      YAxis: module.YAxis,
      CartesianGrid: module.CartesianGrid,
      Tooltip: module.Tooltip,
      Legend: module.Legend,
      Cell: module.Cell,
      Label: module.Label,
      LabelList: module.LabelList,
      ResponsiveContainer: module.ResponsiveContainer,
    }
  }))
);

// Chart loading skeleton
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="w-full" style={{ height }}>
    <Skeleton className="w-full h-full rounded-lg" />
  </div>
);

// Wrapper component for lazy-loaded charts
interface LazyChartWrapperProps {
  children: React.ReactNode;
  height?: number;
}

export const LazyChartWrapper = ({ children, height = 300 }: LazyChartWrapperProps) => (
  <Suspense fallback={<ChartSkeleton height={height} />}>
    {children}
  </Suspense>
);

// Export lazy-loaded chart components
export const useLazyCharts = () => {
  return {
    BarChart: lazy(() => import("recharts").then(m => ({ default: m.BarChart }))),
    PieChart: lazy(() => import("recharts").then(m => ({ default: m.PieChart }))),
    LineChart: lazy(() => import("recharts").then(m => ({ default: m.LineChart }))),
    AreaChart: lazy(() => import("recharts").then(m => ({ default: m.AreaChart }))),
    Bar: lazy(() => import("recharts").then(m => ({ default: m.Bar }))),
    Pie: lazy(() => import("recharts").then(m => ({ default: m.Pie }))),
    Line: lazy(() => import("recharts").then(m => ({ default: m.Line }))),
    Area: lazy(() => import("recharts").then(m => ({ default: m.Area }))),
    XAxis: lazy(() => import("recharts").then(m => ({ default: m.XAxis }))),
    YAxis: lazy(() => import("recharts").then(m => ({ default: m.YAxis }))),
    CartesianGrid: lazy(() => import("recharts").then(m => ({ default: m.CartesianGrid }))),
    Cell: lazy(() => import("recharts").then(m => ({ default: m.Cell }))),
    Label: lazy(() => import("recharts").then(m => ({ default: m.Label }))),
    LabelList: lazy(() => import("recharts").then(m => ({ default: m.LabelList }))),
  };
};

export default LazyChartWrapper;

