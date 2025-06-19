import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../hooks/useAuth';

interface WorkoutLog {
  id: string;
  liftType: string;
  weight: number;
  reps: number;
  sets: number;
  date: string;
  notes?: string;
}

interface HistoricalDataResponse {
  historicalData: {
    BENCH: WorkoutLog[];
    OHP: WorkoutLog[];
    SQUAT: WorkoutLog[];
    DEADLIFT: WorkoutLog[];
  };
  months: number;
  startDate: string;
  endDate: string;
}

const HistoricalDataPage: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<HistoricalDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState(6);

  useEffect(() => {
    fetchHistoricalData();
  }, [selectedMonths, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchHistoricalData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/workouts/historical-data?months=${selectedMonths}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const processChartData = () => {
    if (!data) return [];

    // Create a combined dataset organized by date
    const dateMap = new Map<string, any>();

    // Process each lift type
    Object.entries(data.historicalData).forEach(([liftType, workouts]) => {
      workouts.forEach(workout => {
        const date = new Date(workout.date).toLocaleDateString();
        if (!dateMap.has(date)) {
          dateMap.set(date, { date });
        }
        
        // Use the maximum weight for that date and lift type
        const currentWeight = dateMap.get(date)?.[liftType] || 0;
        if (workout.weight > currentWeight) {
          dateMap.get(date)![liftType] = workout.weight;
        }
      });
    });

    // Convert to array and sort by date
    return Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const chartData = processChartData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading historical data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchHistoricalData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-800 to-green-600 text-white relative overflow-hidden">
            {/* Shimmering effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-30 animate-pulse"></div>
            <div className="relative z-10 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">Lifting Progression</h1>
              
              {/* Time range selector */}
              <div className="flex items-center space-x-2">
                <label htmlFor="months" className="text-sm font-medium text-green-100">
                  Time Range:
                </label>
                <select
                  id="months"
                  value={selectedMonths}
                  onChange={(e) => setSelectedMonths(Number(e.target.value))}
                  className="rounded-md border-green-300 bg-white text-gray-900 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {chartData.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="BENCH" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Bench Press"
                      connectNulls={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="OHP" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Overhead Press"
                      connectNulls={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="SQUAT" 
                      stroke="#ffc658" 
                      strokeWidth={2}
                      name="Squat"
                      connectNulls={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="DEADLIFT" 
                      stroke="#ff7c7c" 
                      strokeWidth={2}
                      name="Deadlift"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">No workout data found</div>
                <p className="text-gray-400">
                  Start logging your workouts to see your progression over time.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalDataPage;
