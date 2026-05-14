
import React from 'react';
import { useApp } from '../context/AppContext';
import AuthForm from '../components/AuthForm';

const Login: React.FC = () => {
    const { login, signUp } = useApp();
    return <AuthForm onLogin={login} onSignUp={signUp} />;
};

export default Login;
