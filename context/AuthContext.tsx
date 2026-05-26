import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.error("AuthContext getSession error:", error);
            }
            if (session) {
                setSession(session);
                setUser(session.user);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: listener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                console.log(`Auth event: ${event}`);
                if (event === 'SIGNED_OUT') {
                    setSession(null);
                    setUser(null);
                } else if (session) {
                    setSession(session);
                    setUser(session.user);
                }
                setLoading(false);
            }
        );

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    const value = {
        user,
        session,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
