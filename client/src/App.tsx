import React, { useState, useEffect } from 'react';
import { fetchInstance } from './utils/api';
import Timer from './components/Timer';

interface Snippet {
  name: string;
  code: string;
  duration: number;
}

const App: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [error, setError] = useState<string>('');
  const [isTimeUp, setIsTimeUp] = useState(false);

  const fetchSnippet = async () => {
    try {
      const data = await fetchInstance<Snippet>('/snippet');
      if (data && data.name && data.code) {
        setSnippet(data);
      } else {
        setSnippet(null);
      }
    } catch (err) {
      console.error('Error fetching snippet:', err);
      setSnippet(null);
    }
  };

  useEffect(() => {
    fetchSnippet();
    const interval = setInterval(fetchSnippet, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    try {
      await fetchInstance('/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, code }),
      });

      await fetchSnippet(); // Refresh snippet after successful submission
      setName('');
      setCode(''); 
      setError('');
      setIsTimeUp(false);
    } catch (err) {
      console.error('Error submitting snippet:', err);
      setError('An error occurred while submitting your snippet.');
    }
  };

  const handleCountdownEnd = () => {
    setIsTimeUp(true);
    setSnippet(null); 
  };

  return (
    <div>
      <h1>Code Snippet of the Day</h1>
      {snippet ? (
        <div>
          <h2>{snippet.name}'s Snippet</h2>
          <pre>{snippet.code}</pre>
          {!isTimeUp ? (
            <Timer duration={snippet.duration} onCountdownEnd={handleCountdownEnd} />
          ) : (
            <div>
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <textarea
                placeholder="Your Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button onClick={handleSubmit}>Submit</button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            placeholder="Your Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button onClick={handleSubmit}>Submit</button>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default App;
