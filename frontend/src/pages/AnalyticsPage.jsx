import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import analyticsService from '../services/analyticsService';
import toast from 'react-hot-toast';
import styles from './AnalyticsPage.module.css';
import EmptyState from '../components/EmptyState';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Helper to style recent activity based on status
const getStatusStyle = (status) => {
  if (status.includes('Pending') || status === 'Ingested')
    return { backgroundColor: '#e9ecef', color: '#495057' };
  if (status.includes('Analyzed') || status.includes('Classified'))
    return { backgroundColor: '#d1ecf1', color: '#0c5460' };
  if (status === 'Routed')
    return { backgroundColor: '#d4edda', color: '#155724' };
  if (status === 'Failed')
    return { backgroundColor: '#f8d7da', color: '#721c24' };
  return {};
};

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService
      .getAnalytics()
      .then((response) => setData(response.data))
      .catch(() => toast.error('Could not load analytics data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container">
        <h2>Loading Analytics...</h2>
      </div>
    );
  }

  if (
    !data ||
    (data.typeBreakdown.length === 0 &&
      data.dailyCounts.length === 0 &&
      data.todaysTypeBreakdown.length === 0)
  ) {
    return (
      <div className="container">
        <h1 className="section__title">Analytics Dashboard</h1>
        <EmptyState
          title="Not Enough Data"
          message="Process some documents to start seeing your analytics and performance metrics here."
        />
      </div>
    );
  }

  // Overall (All-Time) Doughnut Chart
  const overallTypeChartData = {
    labels: data.typeBreakdown.map((item) => item.type),
    datasets: [
      {
        label: '# of Documents',
        data: data.typeBreakdown.map((item) => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)', 'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)', 'rgba(255, 159, 64, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Daily Bar Chart
  const dailyChartData = {
    labels: data.dailyCounts.map((item) => item.date),
    datasets: [
      {
        label: 'Documents Processed',
        data: data.dailyCounts.map((item) => item.count),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };

  // Today's horizontal bar chart
  const todaysTypeChartData = {
    labels: data.todaysTypeBreakdown.map((item) => item.type),
    datasets: [
      {
        label: 'Documents Today',
        data: data.todaysTypeBreakdown.map((item) => item.count),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  return (
    <div className="container">
      <h1 className="section__title">Analytics Dashboard</h1>

      {/* TODAY'S UPDATES SECTION */}
      <div className={styles.sectionDivider}>
        <h2>Today's Updates</h2>
      </div>
      <div className={styles.dailyGrid}>
        <div className={`card ${styles.chartCard}`}>
          <h3>Breakdown Today</h3>
          {data.todaysTypeBreakdown.length > 0 ? (
            <Bar data={todaysTypeChartData} options={{ indexAxis: 'y' }} />
          ) : (
            <p>No documents processed yet today.</p>
          )}
        </div>
        <div className={`card ${styles.chartCard}`}>
          <h3>Recent Activity Today</h3>
          {data.recentActivity.length > 0 ? (
            <ul className={styles.activityFeed}>
              {data.recentActivity.map((doc) => (
                <li key={doc._id} className={styles.activityItem}>
                  <div className={styles.activityInfo}>
                    <span className={styles.activityName}>{doc.originalName}</span>
                    <span className={styles.activityMeta}>
                      {new Date(doc.createdAt).toLocaleTimeString()} - {doc.classification}
                    </span>
                  </div>
                  <span className={styles.activityStatus} style={getStatusStyle(doc.status)}>
                    {doc.status.replace(/_/g, ' ')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No documents processed yet today.</p>
          )}
        </div>
      </div>

      {/* OVERALL ANALYTICS SECTION */}
      <div className={styles.sectionDivider}>
        <h2>Overall Analytics</h2>
      </div>
      <div className={styles.analyticsGrid}>
        <div className={`card ${styles.chartCard}`}>
          <h3>Documents by Type (All Time)</h3>
          {data.typeBreakdown.length > 0 ? (
            <Doughnut data={overallTypeChartData} />
          ) : (
            <p>No data</p>
          )}
        </div>
        <div className={`card ${styles.chartCard}`}>
          <h3>Documents Processed (Last 30 Days)</h3>
          {data.dailyCounts.length > 0 ? (
            <Bar data={dailyChartData} />
          ) : (
            <p>No data</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
