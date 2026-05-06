import React, { createContext, useContext, useState, useCallback } from "react";

// Create the Activity Context
const ActivityContext = createContext();

// Activity Provider Component
export const ActivityProvider = ({ children }) => {
  const [activities, setActivities] = useState([]);

  // Function to add a new activity
  const addActivity = useCallback((activity) => {
    const newActivity = {
      id: `local-${Date.now()}-${Math.random()}`,
      ...activity,
      created_at: activity.created_at || new Date().toISOString(),
      is_new: true, // Mark as new for visual highlighting
    };

    setActivities((prev) => [newActivity, ...prev]); // Add to top

    // Auto-remove "new" flag after 10 seconds
    setTimeout(() => {
      setActivities((prev) =>
        prev.map((act) =>
          act.id === newActivity.id ? { ...act, is_new: false } : act,
        ),
      );
    }, 10000);
  }, []);

  // Function to clear activities (optional)
  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  return (
    <ActivityContext.Provider
      value={{ activities, addActivity, clearActivities }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

// Custom hook to use the Activity Context
export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return context;
};
