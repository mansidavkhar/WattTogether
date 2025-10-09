import { useEffect, useState } from 'react';
import ProjectCard from './ProjectCard';

const MyProject = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) {
      setError('You must be logged in to view your projects');
      setLoading(false);
      return;
    }

    fetch(`${import.meta.env.VITE_API_GATEWAY_URL}/projects?mine=true`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${t}`,
        'x-auth-token': t,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const msg = data?.message || res.statusText || `HTTP ${res.status}`;
          throw new Error(msg);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setProjects(data.projects || []);
        } else {
          setError(data.message || 'Failed to load projects');
        }
      })
      .catch((err) => setError(err?.message || 'Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 bg-white min-h-screen">
      {loading && <div className="text-center text-gray-600 py-10">Loading your projects...</div>}
      {!loading && error && <div className="text-center text-red-600 py-10">{error}</div>}
      {!loading && !error && projects.length === 0 && (
        <div className="text-center text-gray-600 py-10">No projects found.</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10 place-items-center">
        {projects.map((proj) => (
          <ProjectCard key={proj._id} project={proj} />
        ))}
      </div>
    </div>
  );
};

export default MyProject;
