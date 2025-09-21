
import { useEffect, useState } from "react";
import ProjectCard from "./ProjectCard";


const MyProjects = () => {
   const token = localStorage.getItem('token');
    const [projects, setProjects] = useState([])
    useEffect(()=>{
       fetch(`${import.meta.env.VITE_API_GATEWAY_URL}/projects/getmemberprojects`,  {
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
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-6xl">
          {projects.map((proj, index)=>{
                     return <ProjectCard key={index} project={proj}/>
                 })}
        </div>
      </div>
    );
  };
  
  export default MyProjects;
  