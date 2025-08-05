import React from 'react';
import styles from './StatCard.module.css';

const StatCard = ({ title, value, icon, color, onClick, isActive }) => {
  return (
    // This is now a button element to be semantically correct
    <button className={`${styles.statCard} ${isActive ? styles.active : ''}`} onClick={onClick}>
      <div className={styles.iconWrapper} style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className={styles.statInfo}>
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </button>
  );
};

export default StatCard;