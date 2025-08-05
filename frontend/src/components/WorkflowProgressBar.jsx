import React from 'react';
import styles from './WorkflowProgressBar.module.css';
import { FaInbox, FaSearch, FaTags, FaRoute, FaCheck, FaTimes } from 'react-icons/fa';
import { formatDate } from '../utils/formatDate'; // Import our new function

const WorkflowProgressBar = ({ document }) => {
    const { status, classification, confidenceScore, routeDestination } = document;
    const stages = [
        { name: 'Ingested', icon: <FaInbox />, status: 'Ingested' },
        { name: 'Extracted', icon: <FaSearch />, status: 'Extracted' },
        { name: 'Classified', icon: <FaTags />, status: 'Classified' },
        { name: 'Routed', icon: <FaRoute />, status: 'Routed' },
    ];
    const statusOrder = ['Ingested', 'Extraction_Pending', 'Extracted', 'Classification_Pending', 'Classified', 'Routing_Pending', 'Routed'];
    
    const currentStatusIndex = statusOrder.indexOf(status);
    const isFailed = status === 'Failed';
    
    // Calculate progress bar width
    let progress = 0;
    if (currentStatusIndex >= 0) {
        progress = (currentStatusIndex / (statusOrder.length - 1)) * 100;
    }
    
    const getTooltipText = (stage) => {
        switch(stage.name) {
            case 'Ingested':
                return `Ingested: ${formatDate(document.createdAt)}`; // UPDATED LINE
            case 'Classified':
                return `Type: ${classification} (${confidenceScore}%)`;
            case 'Routed':
                return `Destination: ${routeDestination}`;
            default:
                return stage.name;
        }
    };

    return (
        <div className={styles.progressBar}>
            <div className={styles.line}>
                <div className={styles.lineProgress} style={{width: `${progress}%`}}></div>
            </div>
            {stages.map((stage, index) => {
                const stageIndex = statusOrder.indexOf(stage.status);
                const isCompleted = currentStatusIndex >= stageIndex;
                const isActive = status.includes(stage.name.toUpperCase());

                let nodeClass = styles.node;
                if (isFailed) nodeClass += ` ${styles.failed}`;
                else if (isCompleted) nodeClass += ` ${styles.completed}`;
                if (isActive) nodeClass += ` ${styles.active}`;

                return (
                    <div key={stage.name} className={nodeClass}>
                        <div className={styles.nodeIcon}>
                            { isFailed ? <FaTimes/> : (isCompleted ? <FaCheck/> : stage.icon) }
                        </div>
                        <span className={styles.tooltip}>{getTooltipText(stage)}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default WorkflowProgressBar;