import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
// Error monitoring removed

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface LiftChartProps {
  workouts: Array<{
    id: string;
    date: string;
    liftType: string;
    weight: number;
    reps: number;
    sets: number;
  }>;
  liftType: string;
  timeframe: string;
}

const liftColors = {
  BENCH: {
    border: 'rgb(54, 162, 235)',
    background: 'rgba(54, 162, 235, 0.2)',
  },
  OHP: {
    border: 'rgb(255, 99, 132)',
    background: 'rgba(255, 99, 132, 0.2)',
  },
  SQUAT: {
    border: 'rgb(75, 192, 192)',
    background: 'rgba(75, 192, 192, 0.2)',
  },
  DEADLIFT: {
    border: 'rgb(255, 159, 64)',
    background: 'rgba(255, 159, 64, 0.2)',
  },
};

export const LiftChart: React.FC<LiftChartProps> = ({ workouts, liftType, timeframe }) => {
  // Chart rendering metrics
  
  if (!workouts || workouts.length === 0) {
    return <div className="text-center p-8 bg-gray-50 rounded-lg">No workout data available for the selected period.</div>;
  }

  // Format dates and extract weights
  const dates = workouts.map(workout => {
    const date = new Date(workout.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  const weights = workouts.map(workout => workout.weight);

  // Calculate max weight for y-axis padding
  const maxWeight = Math.max(...weights) * 1.1;

  const data = {
    labels: dates,
    datasets: [
      {
        label: liftType,
        data: weights,
        fill: true,
        backgroundColor: liftColors[liftType as keyof typeof liftColors]?.background || 'rgba(0, 0, 0, 0.2)',
        borderColor: liftColors[liftType as keyof typeof liftColors]?.border || 'rgb(0, 0, 0)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${liftType} Progression - ${timeframe}`,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Weight: ${context.parsed.y} lbs`;
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: maxWeight,
        title: {
          display: true,
          text: 'Weight (lbs)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <Line data={data} options={options} />
    </div>
  );
};

// Create error boundary component
class ChartErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.error('Chart error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          <p>There was an error rendering the chart.</p>
          <p>Try selecting a different lift or timeframe.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Export component with error boundary
export default function LiftChartWithErrorBoundary(props: LiftChartProps) {
  return (
    <ChartErrorBoundary>
      <LiftChart {...props} />
    </ChartErrorBoundary>
  );
}