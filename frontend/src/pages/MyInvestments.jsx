
import { useEffect, useState } from "react";
import ProjectCard from "../components/ProjectCard"

export default function MyInvestment() {
  const token = localStorage.getItem('token');
  const [projects, setProjects] = useState([])
  useEffect(()=>{
     fetch(`${import.meta.env.VITE_API_GATEWAY_URL}/projects/getall`,  {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      }}).then((data)=> data.json())
      .then((projects)=>{
        if(projects.success){
           setProjects(projects.projects)
        }
      })
  }, [])

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10 place-items-center">
        {projects.map((proj, index)=>{
            return <ProjectCard key={index} project={proj}/>
        })}
      </div>
    </div>
  );
}