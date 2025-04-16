import { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
    setLoading(false);
  }, []);

  return (
    <UserContext.Provider value={{ username, setUsername, loading }}>
      {children}
    </UserContext.Provider>
  );
};
