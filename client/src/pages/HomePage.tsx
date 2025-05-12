import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <section className="py-12 bg-gray-50 rounded-lg mb-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            TFW MMA Lifting Program
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            An 8-week progressive lifting program designed to improve strength and performance for mixed martial arts athletes.
          </p>
          {user ? (
            <Link to="/dashboard" className="btn-primary text-lg py-3 px-8">
              Go to Dashboard
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/login" className="btn-primary text-lg py-3 px-8">
                Sign In
              </Link>
              <Link to="/register" className="btn-secondary text-lg py-3 px-8">
                Register
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">Program Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">8</div>
            <h3 className="text-xl font-semibold mb-2">Week Program</h3>
            <p className="text-gray-600 dark:text-gray-300">Progressive lifting program with varied rep schemes and intensities</p>
          </div>
          <div className="card text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">4</div>
            <h3 className="text-xl font-semibold mb-2">Main Lifts</h3>
            <p className="text-gray-600 dark:text-gray-300">Focus on bench press, overhead press, deadlift, and back squat</p>
          </div>
          <div className="card text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">20+</div>
            <h3 className="text-xl font-semibold mb-2">Supplemental Exercises</h3>
            <p className="text-gray-600 dark:text-gray-300">Additional workouts for complete muscle development</p>
          </div>
          <div className="card text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">4</div>
            <h3 className="text-xl font-semibold mb-2">Days per Week</h3>
            <p className="text-gray-600 dark:text-gray-300">Upper and lower body split across Monday through Thursday</p>
          </div>
        </div>
      </section>



      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">Schedule</h2>
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Weekly Class Schedule</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            We offer a consistent weekly schedule with classes at the same times each week. Simply select a time that works for you through our booking system.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-lg mb-2 text-primary-600">Monday (Upper Body)</h4>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                <li>4:00 PM - 5:00 PM (Upper Body)</li>
                <li>5:00 PM - 6:00 PM (Upper Body)</li>
                <li>6:00 PM - 7:00 PM (Upper Body)</li>
                <li>7:00 PM - 8:00 PM (Upper Body)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-lg mb-2 text-primary-600">Tuesday (Lower Body)</h4>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                <li>4:00 PM - 5:00 PM (Lower Body)</li>
                <li>5:00 PM - 6:00 PM (Lower Body)</li>
                <li>6:00 PM - 7:00 PM (Lower Body)</li>
                <li>7:00 PM - 8:00 PM (Lower Body)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-lg mb-2 text-primary-600">Wednesday (Upper Body)</h4>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                <li>4:00 PM - 5:00 PM (Upper Body)</li>
                <li>5:00 PM - 6:00 PM (Upper Body)</li>
                <li>6:00 PM - 7:00 PM (Upper Body)</li>
                <li>7:00 PM - 8:00 PM (Upper Body)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-lg mb-2 text-primary-600">Thursday (Lower Body)</h4>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                <li>4:00 PM - 5:00 PM (Lower Body)</li>
                <li>5:00 PM - 6:00 PM (Lower Body)</li>
                <li>6:00 PM - 7:00 PM (Lower Body)</li>
                <li>7:00 PM - 8:00 PM (Lower Body)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-lg mb-2 text-primary-600">Friday</h4>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                <li>4:00 PM - 5:00 PM (Upper & Lower Body)</li>
                <li>5:00 PM - 6:00 PM (Upper & Lower Body)</li>
                <li>6:00 PM - 7:00 PM (Upper & Lower Body)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-lg mb-2 text-primary-600">Saturday</h4>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                <li>9:00 AM - 10:00 AM (Upper & Lower Body)</li>
                <li>10:00 AM - 11:00 AM (Upper & Lower Body)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="text-center card p-6 mb-6">
        <h2 className="text-3xl font-bold mb-6">Ready to start your training?</h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Join our program today and transform your strength, power, and athletic performance.
        </p>
        {user ? (
          <Link to="/schedule" className="btn-primary text-lg py-3 px-8">
            Book a Session
          </Link>
        ) : (
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/login" className="btn-primary text-lg py-3 px-8">
              Sign In
            </Link>
            <Link to="/register" className="btn-secondary text-lg py-3 px-8">
              Register
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;