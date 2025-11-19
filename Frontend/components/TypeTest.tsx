// Quick test to see which properties are available in our adapted types
import React, { useEffect, useState } from 'react';
import db from '../services/db';

const TypeTest: React.FC = () => {
  const [results, setResults] = useState<any>({});

  useEffect(() => {
    const test = async () => {
      try {
        // Test 1: Get first user and log its properties
        const users = await db.users.find({});
        if (users.length > 0) {
          console.log('First user properties:', Object.keys(users[0]));
          console.log('First user:', users[0]);
        }

        // Test 2: Get first candidate and log its properties
        const candidates = await db.candidates.getAll();
        if (candidates.length > 0) {
          console.log('First candidate properties:', Object.keys(candidates[0]));
          console.log('First candidate:', candidates[0]);
        }

        // Test 3: Get first department and log its properties
        const departments = await db.departments.getAll();
        if (departments.length > 0) {
          console.log('First department properties:', Object.keys(departments[0]));
          console.log('First department:', departments[0]);
        }

        setResults({ 
          userCount: users.length, 
          candidateCount: candidates.length,
          departmentCount: departments.length,
          firstUser: users[0] || null,
          firstCandidate: candidates[0] || null,
          firstDepartment: departments[0] || null
        });
      } catch (error) {
        console.error('Test failed:', error);
        setResults({ error: error.message });
      }
    };

    test();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h3>Database Type Test</h3>
      <pre>{JSON.stringify(results, null, 2)}</pre>
    </div>
  );
};

export default TypeTest;
