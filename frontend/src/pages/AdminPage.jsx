import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import toast from 'react-hot-toast';
import styles from './AdminPage.module.css';
import { formatDate } from '../utils/formatDate'; // Import our new function

const AdminPage = () => {
    const [view, setView] = useState('users');
    const [users, setUsers] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (view === 'users') {
                    const response = await adminService.getAllUsers();
                    setUsers(response.data);
                } else {
                    const response = await adminService.getAllDocuments();
                    setDocuments(response.data);
                }
            } catch (error) {
                toast.error(`Failed to fetch ${view}.`);
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [view]);


    return (
        <div className="container">
            <h1 className={styles.header}>Admin Dashboard</h1>
            <div className={styles.tabs}>
                <button
                    className={`${styles.tabButton} ${view === 'users' ? styles.active : ''}`}
                    onClick={() => setView('users')}
                >
                    Manage Users
                </button>
                <button
                    className={`${styles.tabButton} ${view === 'documents' ? styles.active : ''}`}
                    onClick={() => setView('documents')}
                >
                    Manage Documents
                </button>
            </div>

            <div className="card">
                {loading ? <p>Loading data...</p> : (
                    <div className={styles.tableContainer}>
                        {view === 'users' ? (
                            <table className={styles.table}>
                                <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Joined On</th></tr></thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user._id}>
                                            <td>{user.username}</td>
                                            <td>{user.email}</td>
                                            <td>{user.role}</td>
                                            <td>{formatDate(user.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                             <table className={styles.table}>
                                <thead><tr><th>Document Name</th><th>Owner</th><th>Classification</th><th>Status</th><th>Processed On</th></tr></thead>
                                <tbody>
                                    {documents.map(doc => (
                                        <tr key={doc._id}>
                                            <td>{doc.originalName}</td>
                                            <td>{doc.owner?.username || 'N/A'}</td>
                                            <td>{doc.classification}</td>
                                            <td>{doc.status}</td>
                                            <td>{formatDate(doc.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;