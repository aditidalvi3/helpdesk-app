import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';

// Context for Firebase and User
const AppContext = createContext(null);

// Global variables for Firebase config and app ID
// IMPORTANT: If running this code locally (outside of the Google Canvas environment),
// you will need to replace 'default-app-id' and the 'firebaseConfig' object
// with your actual Firebase project's details.
// In the Google Canvas, these '__' prefixed variables are automatically provided.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; // Fallback for local development
const firebaseConfig = typeof __firebase_config !== 'undefined'
    ? JSON.parse(__firebase_config)
    : { // Placeholder for local development - REPLACE WITH YOUR ACTUAL FIREBASE CONFIG
        apiKey: "AIzaSyBYDIkjSoHXZOK2Id6QhSvGITvbeec56eA",
        authDomain: "help-desk-37fda.firebaseapp.com",
        projectId: "help-desk-37fda",
        storageBucket: "help-desk-37fda.firebasestorage.app",
        messagingSenderId: "163570240377",
        appId: "1:163570240377:web:068e8839c9d07be119bda8",
        measurementId: "G-60SVD3L935"
    };
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null; // Fallback for local development

// Firebase Initialization and Auth Provider
function AppProvider({ children }) {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        // Initialize Firebase app
        const app = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(app);
        const firebaseAuth = getAuth(app);

        setDb(firestoreDb);
        setAuth(firebaseAuth);

        // Listen for authentication state changes
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
            if (user) {
                // User is signed in
                setUserId(user.uid);
            } else {
                // User is signed out, sign in anonymously if no token is provided by the environment
                if (!initialAuthToken) {
                    try {
                        await signInAnonymously(firebaseAuth);
                        console.log("Signed in anonymously.");
                    } catch (error) {
                        console.error("Error signing in anonymously:", error);
                    }
                }
            }
            setIsAuthReady(true); // Auth state is ready
        });

        // If an initial auth token is provided by the environment, sign in with it
        const signInWithToken = async () => {
            if (initialAuthToken && firebaseAuth && !firebaseAuth.currentUser) {
                try {
                    await signInWithCustomToken(firebaseAuth, initialAuthToken);
                    console.log("Signed in with custom token.");
                } catch (error) {
                    console.error("Error signing in with custom token:", error);
                    // Fallback to anonymous if custom token fails
                    try {
                        await signInAnonymously(firebaseAuth);
                        console.log("Signed in anonymously as fallback.");
                    } catch (anonError) {
                        console.error("Error signing in anonymously as fallback:", anonError);
                    }
                }
            }
        };

        // Only attempt to sign in with token if firebaseAuth is initialized
        if (firebaseAuth) {
            signInWithToken();
        }

        // Cleanup subscription on unmount to prevent memory leaks
        return () => unsubscribe();
    }, []); // Empty dependency array means this effect runs once on mount

    return (
        <AppContext.Provider value={{ db, auth, userId, isAuthReady }}>
            {children}
        </AppContext.Provider>
    );
}

// Utility hook to use Firebase context throughout the app
function useFirebase() {
    const context = useContext(AppContext);
    if (!context) {
        // This error indicates the hook is used outside of AppProvider
        throw new Error('useFirebase must be used within an AppProvider');
    }
    return context;
}

// Header Component: Displays app title and user actions
const Header = ({ onProfileClick }) => {
    const { userId } = useFirebase();

    // Function to get initials from userId for display
    const getInitials = (id) => {
        if (!id) return 'BM'; // Default initials if userId is not available
        return id.slice(0, 2).toUpperCase();
    };

    return (
        <header className="bg-teal-400 p-4 flex justify-between items-center shadow-md rounded-b-lg">
            <h1 className="text-white text-2xl font-bold font-inter">Helpdesk</h1>
            <div className="flex items-center space-x-4">
                <span className="bg-white text-teal-600 font-bold rounded-full w-8 h-8 flex items-center justify-center cursor-pointer shadow-inner"
                      onClick={onProfileClick}>
                    {getInitials(userId)}
                </span>
                <button className="text-white focus:outline-none">
                    {/* Bell icon for notifications */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </button>
                <button className="text-white focus:outline-none" onClick={onProfileClick}>
                    {/* User icon to navigate to profile */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </button>
                <button className="text-white focus:outline-none">
                    {/* Logout/Refresh icon (functionality not implemented in this example) */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356-2A8.001 8.001 0 004 12c0 2.972 1.15 5.728 3.018 7.75l-.711 1.054A8.001 8.001 0 014 12c0-3.042 1.135-5.824 3.018-7.75L7.71 3.204m0 0H20" />
                    </svg>
                </button>
            </div>
        </header>
    );
};

// Sidebar Component: Provides navigation links
const Sidebar = ({ currentPage, onNavigate }) => {
    const navItems = [
        { name: 'Dashboard', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        ), page: 'dashboard' },
        { name: 'New Ticket', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M16 16h.01" />
            </svg>
        ), page: 'new-ticket' },
        { name: 'My Ticket', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M16 16h.01" />
            </svg>
        ), page: 'my-tickets' },
    ];

    return (
        <div className="w-64 bg-gray-200 p-4 shadow-lg rounded-r-lg">
            <nav className="mt-4">
                <ul>
                    {navItems.map((item) => (
                        <li key={item.name} className="mb-2">
                            <button
                                className={`flex items-center w-full p-2 rounded-md text-gray-700 hover:bg-gray-300 focus:outline-none ${
                                    currentPage === item.page ? 'bg-gray-300 font-semibold' : ''
                                }`}
                                onClick={() => onNavigate(item.page)}
                            >
                                {item.icon}
                                {item.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

// Footer Component: Simple footer for the application
const Footer = () => {
    return (
        <footer className="bg-teal-400 p-2 text-center text-white text-sm rounded-t-lg shadow-md">
            Footer Area
        </footer>
    );
};

// Dashboard Component: Displays ticket statistics
const Dashboard = () => {
    const { db, userId, isAuthReady } = useFirebase();
    const [ticketCounts, setTicketCounts] = useState({
        totalTickets: 0,
        totalSolved: 0,
        totalAwaitingApproval: 0,
        totalInProgress: 0,
    });

    useEffect(() => {
        // Only proceed if Firebase is ready and user is authenticated
        if (!db || !isAuthReady || !userId) return;

        // Reference to the user's tickets collection in Firestore
        const userTicketsColRef = collection(db, `artifacts/${appId}/users/${userId}/tickets`);

        // Set up a real-time listener for ticket changes
        const unsubscribe = onSnapshot(userTicketsColRef, (snapshot) => {
            let totalTickets = 0;
            let totalSolved = 0;
            let totalAwaitingApproval = 0;
            let totalInProgress = 0;

            // Iterate through documents to calculate counts based on status
            snapshot.forEach((doc) => {
                totalTickets++;
                const data = doc.data();
                if (data.status === 'Closed') {
                    totalSolved++;
                } else if (data.status === 'Awaiting Approval') {
                    totalAwaitingApproval++;
                } else if (data.status === 'In Progress') {
                    totalInProgress++;
                }
            });

            // Update state with new counts
            setTicketCounts({
                totalTickets,
                totalSolved,
                totalAwaitingApproval,
                totalInProgress,
            });
        }, (error) => {
            console.error("Error fetching ticket counts:", error);
            // Optionally, display an error message to the user
        });

        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
    }, [db, userId, isAuthReady]); // Re-run effect if these dependencies change

    // Card component for displaying individual statistics
    const Card = ({ title, value, bgColor }) => (
        <div className={`flex flex-col items-center justify-center p-8 rounded-xl shadow-lg text-white font-bold text-4xl ${bgColor} w-64 h-48 m-4`}>
            <div className="text-xl mb-2">{title}</div>
            <div>{value}</div>
        </div>
    );

    return (
        <div className="flex-1 p-8 bg-white rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 font-inter">Dashboard</h2>
            <div className="flex flex-wrap justify-center gap-8">
                <Card title="Total Tickets" value={ticketCounts.totalTickets} bgColor="bg-blue-500" />
                <Card title="Total Solved" value={ticketCounts.totalSolved} bgColor="bg-green-500" />
                <Card title="Total Awaiting Approval" value={ticketCounts.totalAwaitingApproval} bgColor="bg-red-500" />
                <Card title="Total in Progress" value={ticketCounts.totalInProgress} bgColor="bg-yellow-500" />
            </div>
        </div>
    );
};

// New Ticket Component: Form to submit a new helpdesk ticket
const NewTicket = () => {
    const { db, userId, isAuthReady } = useFirebase();
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState(''); // For displaying success/error messages

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior

        // Check if Firebase is ready and user is authenticated
        if (!db || !userId || !isAuthReady) {
            setMessage('Firebase not ready or user not authenticated. Please try again.');
            return;
        }

        // Basic form validation
        if (!subject || !description) {
            setMessage('Please fill in all fields (Subject and Description).');
            return;
        }

        try {
            // Reference to the user's tickets collection
            const ticketRef = collection(db, `artifacts/${appId}/users/${userId}/tickets`);

            // Generate a simple ticket number. In a real-world app, this might be more robust.
            const ticketCountSnapshot = await getDocs(ticketRef);
            const ticketNo = `TKT-${String(ticketCountSnapshot.size + 1).padStart(4, '0')}`;

            // Add the new ticket document to Firestore
            await addDoc(ticketRef, {
                ticketNo: ticketNo,
                subject: subject,
                description: description,
                status: 'In Progress', // Default status for new tickets
                supportBy: 'N/A', // Placeholder, would be assigned by support staff
                date: new Date().toLocaleDateString('en-GB'), // Current date in DD/MM/YYYY format
                rate: 0, // Initial rating
                createdAt: new Date(), // Timestamp for sorting
                userId: userId, // Store the ID of the user who created the ticket
            });

            setMessage('Ticket submitted successfully!');
            // Clear form fields after successful submission
            setSubject('');
            setDescription('');
        } catch (error) {
            console.error("Error adding document: ", error);
            setMessage(`Error submitting ticket: ${error.message}`);
        }
    };

    return (
        <div className="flex-1 p-8 bg-white rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 font-inter">New Ticket</h2>
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-gray-100 p-8 rounded-xl shadow-md">
                <div className="mb-6">
                    <label htmlFor="subject" className="block text-gray-700 text-lg font-semibold mb-2">Subject</label>
                    <input
                        type="text"
                        id="subject"
                        className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="description" className="block text-gray-700 text-lg font-semibold mb-2">Description</label>
                    <textarea
                        id="description"
                        rows="6"
                        className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    ></textarea>
                </div>
                <button
                    type="submit"
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
                >
                    Submit Ticket
                </button>
                {message && (
                    <p className="mt-4 text-center text-sm font-medium text-gray-700">{message}</p>
                )}
            </form>
        </div>
    );
};

// My Tickets Component: Displays a list of user's tickets with search and pagination
const MyTickets = () => {
    const { db, userId, isAuthReady } = useFirebase();
    const [tickets, setTickets] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Only proceed if Firebase is ready and user is authenticated
        if (!db || !userId || !isAuthReady) {
            setMessage('Firebase not ready or user not authenticated. Cannot load tickets.');
            return;
        }

        const userTicketsColRef = collection(db, `artifacts/${appId}/users/${userId}/tickets`);

        // Set up a real-time listener for ticket changes
        const unsubscribe = onSnapshot(userTicketsColRef, (snapshot) => {
            const fetchedTickets = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort tickets by creation date, newest first, for consistent display
            fetchedTickets.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
            setTickets(fetchedTickets);
            setMessage(''); // Clear any previous messages on successful fetch
        }, (error) => {
            console.error("Error fetching tickets:", error);
            setMessage(`Error loading tickets: ${error.message}`);
        });

        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
    }, [db, userId, isAuthReady]); // Re-run effect if these dependencies change

    // Filtered tickets based on the search term
    const filteredTickets = tickets.filter(ticket =>
        ticket.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.supportBy.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic calculations
    const totalPages = Math.ceil(filteredTickets.length / entriesPerPage);
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredTickets.slice(indexOfFirstEntry, indexOfLastEntry);

    // Function to change the current page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Helper function to determine status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case 'In Progress': return 'bg-green-500';
            case 'On hold': return 'bg-gray-500';
            case 'Closed': return 'bg-blue-500';
            case 'Awaiting Approval': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    // StarRating component for displaying ticket ratings
    const StarRating = ({ rate }) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 ${i <= rate ? 'text-yellow-400' : 'text-gray-300'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.683-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.565-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                </svg>
            );
        }
        return <div className="flex">{stars}</div>;
    };

    return (
        <div className="flex-1 p-8 bg-white rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 font-inter">List of Ticket</h2>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                    <label htmlFor="search" className="text-gray-700 text-lg font-semibold">Find ticket</label>
                    <div className="relative">
                        <input
                            type="text"
                            id="search"
                            className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400 pl-10"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <label htmlFor="entries" className="text-gray-700 text-lg font-semibold">Show:</label>
                    <select
                        id="entries"
                        className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        value={entriesPerPage}
                        onChange={(e) => {
                            setEntriesPerPage(Number(e.target.value));
                            setCurrentPage(1); // Reset to first page on entries change
                        }}
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                    </select>
                    <span className="text-gray-700 text-lg font-semibold">Entries</span>
                </div>
            </div>

            {message && (
                <p className="mt-4 text-center text-sm font-medium text-gray-700">{message}</p>
            )}

            <div className="overflow-x-auto rounded-lg shadow-md">
                <table className="min-w-full bg-white rounded-lg">
                    <thead>
                        <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                            <th className="py-3 px-6">Ticket No.</th>
                            <th className="py-3 px-6">Subject</th>
                            <th className="py-3 px-6">Status</th>
                            <th className="py-3 px-6">Support by</th>
                            <th className="py-3 px-6">Date</th>
                            <th className="py-3 px-6">Rate</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700 text-sm font-light">
                        {currentEntries.length > 0 ? (
                            currentEntries.map((ticket) => (
                                <tr key={ticket.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="py-3 px-6 whitespace-nowrap">
                                        <a href="#" className="text-blue-600 hover:underline">{ticket.ticketNo}</a>
                                    </td>
                                    <td className="py-3 px-6">{ticket.subject}</td>
                                    <td className="py-3 px-6">
                                        <span className={`py-1 px-3 rounded-full text-xs font-semibold text-white ${getStatusColor(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6">{ticket.supportBy}</td>
                                    <td className="py-3 px-6">{ticket.date}</td>
                                    <td className="py-3 px-6">
                                        <StarRating rate={ticket.rate} />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-gray-500">No tickets found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-6">
                <div className="text-gray-600 text-sm">
                    Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredTickets.length)} of {filteredTickets.length} entries
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        &laquo;
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => paginate(page)}
                            className={`px-4 py-2 rounded-md border border-gray-300 ${
                                currentPage === page ? 'bg-teal-400 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        &raquo;
                    </button>
                </div>
            </div>
        </div>
    );
};

// User Profile Component: Displays and allows editing of user profile, and submitting feedback
const UserProfile = () => {
    const { db, userId, isAuthReady } = useFirebase();
    const [profile, setProfile] = useState({
        username: '',
        contactNumber: '',
        email: '',
        department: '',
        realName: '',
        accessLevel: '',
        projectAccessLevel: '',
    });
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode
    const [message, setMessage] = useState(''); // For displaying success/error messages

    useEffect(() => {
        // Only proceed if Firebase is ready and user is authenticated
        if (!db || !userId || !isAuthReady) {
            setMessage('Firebase not ready or user not authenticated. Cannot load profile.');
            return;
        }

        // Reference to the user's profile document
        const userProfileDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'myProfile');

        // Set up a real-time listener for the user profile document
        const unsubscribe = onSnapshot(userProfileDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setProfile(docSnap.data());
            } else {
                // If profile doesn't exist, create a default one
                setDoc(userProfileDocRef, {
                    username: `User_${userId.substring(0, 6)}`, // Generate a simple username
                    contactNumber: 'N/A',
                    email: 'N/A',
                    department: 'N/A',
                    realName: '',
                    accessLevel: 'User',
                    projectAccessLevel: 'Basic',
                    feedback: [], // Initialize feedback as an empty array
                }).then(() => {
                    console.log("Default profile created.");
                }).catch(error => {
                    console.error("Error creating default profile:", error);
                });
            }
            setMessage(''); // Clear any previous messages on successful fetch
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setMessage(`Error loading profile: ${error.message}`);
        });

        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
    }, [db, userId, isAuthReady]); // Re-run effect if these dependencies change

    // Handler for updating user profile
    const handleProfileUpdate = async (e) => {
        e.preventDefault(); // Prevent default form submission

        if (!db || !userId || !isAuthReady) {
            setMessage('Firebase not ready or user not authenticated.');
            return;
        }

        try {
            const userProfileDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'myProfile');
            // Update the profile document with new values
            await updateDoc(userProfileDocRef, {
                username: profile.username,
                contactNumber: profile.contactNumber,
                email: profile.email,
                realName: profile.realName,
                accessLevel: profile.accessLevel,
                projectAccessLevel: profile.projectAccessLevel,
                // Passwords are not directly stored/updated here for security reasons in a simple example.
                // In a real application, password changes would involve Firebase Authentication's
                // dedicated password update functions (e.g., updatePassword, reauthenticateWithCredential).
                // Storing passwords directly in Firestore is highly discouraged.
            });
            setMessage('Profile updated successfully!');
            setIsEditing(false); // Exit edit mode after successful update
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage(`Error updating profile: ${error.message}`);
        }
    };

    // Handler for submitting feedback
    const handleFeedbackSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission

        if (!db || !userId || !isAuthReady) {
            setMessage('Firebase not ready or user not authenticated.');
            return;
        }

        // Validate feedback input
        if (!feedbackText.trim() || feedbackRating === 0) {
            setMessage('Please provide feedback text and a rating (at least one star).');
            return;
        }

        try {
            const userProfileDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'myProfile');
            // Fetch current profile to append new feedback
            const currentProfile = (await getDoc(userProfileDocRef)).data();
            const updatedFeedback = [...(currentProfile.feedback || []), {
                rating: feedbackRating,
                text: feedbackText,
                date: new Date().toLocaleDateString('en-GB'), // Record submission date
            }];
            // Update the profile document with the new feedback array
            await updateDoc(userProfileDocRef, { feedback: updatedFeedback });
            setMessage('Feedback submitted successfully!');
            // Clear feedback form fields
            setFeedbackText('');
            setFeedbackRating(0);
        } catch (error) {
            console.error("Error submitting feedback:", error);
            setMessage(`Error submitting feedback: ${error.message}`);
        }
    };

    // FeedbackStarRating component for interactive star rating
    const FeedbackStarRating = ({ rating, setRating }) => {
        return (
            <div className="flex justify-center my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-8 w-8 cursor-pointer ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        onClick={() => setRating(star)}
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.683-1.539 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.565-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        );
    };

    return (
        <div className="flex-1 p-8 bg-white rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 font-inter">User Profile</h2>

            {message && (
                <p className="mt-4 text-center text-sm font-medium text-gray-700">{message}</p>
            )}

            {isEditing ? (
                // Edit Profile Form
                <form onSubmit={handleProfileUpdate} className="max-w-3xl mx-auto bg-gray-100 p-8 rounded-xl shadow-md">
                    <h3 className="text-2xl font-semibold mb-6 text-gray-800">Edit Account</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="col-span-1">
                            <label htmlFor="username" className="block text-gray-700 font-semibold mb-1">Username</label>
                            <input
                                type="text"
                                id="username"
                                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
                                value={profile.username}
                                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                            />
                        </div>
                        <div className="col-span-1">
                            <label htmlFor="currentPassword" className="block text-gray-700 font-semibold mb-1">Current Password</label>
                            <input
                                type="password"
                                id="currentPassword"
                                className="w-full px-4 py-2 rounded-md border border-gray-300 bg-gray-200 cursor-not-allowed"
                                placeholder="******"
                                disabled // Passwords are not directly managed here
                            />
                        </div>
                        <div className="col-span-1">
                            <label htmlFor="email" className="block text-gray-700 font-semibold mb-1">Email</label>
                            <input
                                type="email"
                                id="email"
                                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            />
                        </div>
                        <div className="col-span-1">
                            <label htmlFor="newPassword" className="block text-gray-700 font-semibold mb-1">New Password</label>
                            <input
                                type="password"
                                id="newPassword"
                                className="w-full px-4 py-2 rounded-md border border-gray-300 bg-gray-200 cursor-not-allowed"
                                placeholder="******"
                                disabled // Passwords are not directly managed here
                            />
                        </div>
                        <div className="col-span-1">
                            <label htmlFor="realName" className="block text-gray-700 font-semibold mb-1">Real Name</label>
                            <input
                                type="text"
                                id="realName"
                                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
                                value={profile.realName}
                                onChange={(e) => setProfile({ ...profile, realName: e.target.value })}
                            />
                        </div>
                        <div className="col-span-1">
                            <label htmlFor="confirmPassword" className="block text-gray-700 font-semibold mb-1">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                className="w-full px-4 py-2 rounded-md border border-gray-300 bg-gray-200 cursor-not-allowed"
                                placeholder="******"
                                disabled // Passwords are not directly managed here
                            />
                        </div>
                        <div className="col-span-1">
                            <label htmlFor="accessLevel" className="block text-gray-700 font-semibold mb-1">Access Level</label>
                            <input
                                type="text"
                                id="accessLevel"
                                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
                                value={profile.accessLevel}
                                onChange={(e) => setProfile({ ...profile, accessLevel: e.target.value })}
                            />
                        </div>
                        <div className="col-span-1">
                            <label htmlFor="projectAccessLevel" className="block text-gray-700 font-semibold mb-1">Project Access Level</label>
                            <input
                                type="text"
                                id="projectAccessLevel"
                                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
                                value={profile.projectAccessLevel}
                                onChange={(e) => setProfile({ ...profile, projectAccessLevel: e.target.value })}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-8 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Update User
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="mt-8 ml-4 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Cancel
                    </button>
                </form>
            ) : (
                // Display Profile and Feedback Section
                <div className="flex flex-wrap justify-center gap-8">
                    {/* User Profile Display Card */}
                    <div className="bg-gray-100 p-8 rounded-xl shadow-md w-96 flex flex-col items-center relative">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="absolute top-4 right-4 text-gray-600 hover:text-teal-500 focus:outline-none"
                            title="Edit Profile"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        <div className="bg-gray-300 rounded-full w-24 h-24 flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <p className="text-gray-700 text-lg font-semibold mb-2">Username: <span className="font-normal">{profile.username || 'N/A'}</span></p>
                        <p className="text-gray-700 text-lg font-semibold mb-2">Contact Number: <span className="font-normal">{profile.contactNumber || 'N/A'}</span></p>
                        <p className="text-gray-700 text-lg font-semibold mb-2">Email: <span className="font-normal">{profile.email || 'N/A'}</span></p>
                        <p className="text-gray-700 text-lg font-semibold mb-2">Department: <span className="font-normal">{profile.department || 'N/A'}</span></p>
                    </div>

                    {/* Give Your Feedback Card */}
                    <div className="bg-gray-100 p-8 rounded-xl shadow-md w-96 flex flex-col items-center">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Give Your Feedback</h3>
                        <textarea
                            className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400 mb-4"
                            rows="4"
                            placeholder="Type your feedback here..."
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                        ></textarea>
                        <FeedbackStarRating rating={feedbackRating} setRating={setFeedbackRating} />
                        <button
                            onClick={handleFeedbackSubmit}
                            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 mt-4"
                        >
                            Submit Feedback
                        </button>
                    </div>
                </div>
            )}
            <div className="mt-8 p-4 bg-gray-100 rounded-xl shadow-md max-w-3xl mx-auto">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Your User ID:</h3>
                <p className="break-all text-gray-700 text-sm">{userId || 'Loading User ID...'}</p>
            </div>
        </div>
    );
};

// Main App Component: Orchestrates the entire application layout and navigation
const App = () => {
    // State to manage the current page/view
    const [currentPage, setCurrentPage] = useState('dashboard');

    return (
        <AppProvider>
            {/* Consumer of the context to check authentication readiness */}
            {/* The useFirebase hook is now called within the component tree that is wrapped by AppProvider */}
            <AppContentWithLoading currentPage={currentPage} setCurrentPage={setCurrentPage} />
        </AppProvider>
    );
};

// New component to handle loading state and then render the main app content
const AppContentWithLoading = ({ currentPage, setCurrentPage }) => {
    const { isAuthReady } = useFirebase(); // Now safely consuming context

    // Function to handle navigation between different pages/views
    const handleNavigate = (page) => {
        setCurrentPage(page);
    };

    // Renders the appropriate component based on the current page state
    const renderContent = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard />;
            case 'new-ticket':
                return <NewTicket />;
            case 'my-tickets':
                return <MyTickets />;
            case 'user-profile':
                return <UserProfile />;
            default:
                return <Dashboard />; // Fallback to Dashboard
        }
    };

    // Show a loading screen until Firebase authentication is ready
    if (!isAuthReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal-500 mb-4"></div>
                    <p className="text-teal-700 text-lg font-semibold">Loading application...</p>
                    <p className="text-gray-500 text-sm mt-2">Connecting to Firebase and authenticating user.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col font-inter bg-gray-50">
            <Header onProfileClick={() => handleNavigate('user-profile')} />
            <div className="flex flex-1">
                <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
                <main className="flex-1 p-4 flex flex-col">
                    {renderContent()}
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default App;
