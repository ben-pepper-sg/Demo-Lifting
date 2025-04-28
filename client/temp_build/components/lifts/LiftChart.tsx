import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import * as Sentry from '@sentry/react';

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
  // Add chart rendering metrics to Sentry
  Sentry.setTag('chart_type', 'lift_progression');
  Sentry.setTag('lift_type', liftType);
  Sentry.setTag('timeframe', timeframe);
  
  // Set context for better error tracking
  Sentry.setContext('chart_data', {
    dataPoints: workouts?.length || 0,
    timeframe: timeframe,
    liftType: liftType
  });
  
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

// Wrap the component with Sentry performance monitoring and error boundary
export default Sentry.withProfiler(
  ({ workouts, liftType, timeframe }) => (
    <Sentry.ErrorBoundary 
      fallback={({ error }) => {
        // Report error to console and show a nicer fallback UI
        console.error('Chart error:', error);
        return (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            <p>There was an error rendering the chart.</p>
            <p>Try selecting a different lift or timeframe.</p>
          </div>
        );
      }}
    >
      <LiftChart workouts={workouts} liftType={liftType} timeframe={timeframe} />
    </Sentry.ErrorBoundary>
  ), 
  { name: 'LiftChart' }
);