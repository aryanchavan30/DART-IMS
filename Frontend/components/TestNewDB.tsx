// Test component to verify the adapted database service works
import React, { useEffect, useState } from 'react';
import db from '../services/db';
import { User } from '../types';

const TestNewDB: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testDB = async () => {
      try {
        console.log('Testing new database service...');
        
        // Test users.find
        const allUsers = await db.users.find({});
        console.log('Users found:', allUsers);
        setUsers(allUsers);
        
        // Test candidates.getAll
        const candidates = await db.candidates.getAll();
        console.log('Candidates found:', candidates.length);
        
        // Test interns.getAll
        const interns = await db.interns.getAll();
        console.log('Interns found:', interns.length);
        
        setLoading(false);
      } catch (err) {
        console.error('Database test failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    testDB();
  }, []);

  if (loading) {
    return <div>Testing database connection...</div>;
  }

  if (error) {
    return (
      <div>
        <h3>Database Test Failed</h3>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <h3>Database Test Successful!</h3>
      <p>Found {users.length} users:</p>
      <ul>
        {users.slice(0, 5).map(user => (
          <li key={user.id}>
            {user.name} ({user.email}) - {user.role}
            {user.departmentId && <span> - Dept: {user.departmentId}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TestNewDB;
