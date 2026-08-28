import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../store/authApi';

export function RegisterPage() {
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register({ email, password, name: name || undefined }).unwrap();
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? (err as { data: { message?: string } }).data?.message
          : undefined;
      setError(msg ?? 'Registration failed');
    }
  };

  return (
    <div
      style={{ maxWidth: 400, margin: '80px auto', padding: '0 1rem', fontFamily: 'sans-serif' }}
    >
      <h1>Create account</h1>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
      >
        <input
          type="text"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <a
        href="/api/auth/google"
        style={{ display: 'block', marginTop: '1rem', textAlign: 'center' }}
      >
        Sign up with Google
      </a>
      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        Have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
