import { 
  SiNextdotjs, SiReact, SiTypescript, SiJavascript, SiTailwindcss, 
  SiFigma, SiNodedotjs, SiPython, SiHtml5, SiCss, SiVuedotjs,
  SiAngular, SiFirebase, SiSupabase, SiMongodb, SiPostgresql,
  SiGooglecloud, SiVercel, SiDocker, SiGit, SiGraphql,
  SiPrisma, SiFramer, SiStripe
} from "react-icons/si";
import { Code2 } from "lucide-react";

export function SkillIcon({ skill, className = "w-5 h-5" }: { skill: string, className?: string }) {
  const name = skill.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  switch(name) {
    case "nextjs": 
    case "next": return <SiNextdotjs className={className} />;
    case "react":
    case "reactjs": 
    case "reactnative": return <SiReact className={`${className} text-[#61DAFB]`} />;
    case "typescript": 
    case "ts": return <SiTypescript className={`${className} text-[#3178C6]`} />;
    case "javascript": 
    case "js": return <SiJavascript className={`${className} text-[#F7DF1E]`} />;
    case "tailwind":
    case "tailwindcss": return <SiTailwindcss className={`${className} text-[#06B6D4]`} />;
    case "figma": return <SiFigma className={`${className} text-[#F24E1E]`} />;
    case "node":
    case "nodejs": return <SiNodedotjs className={`${className} text-[#339933]`} />;
    case "python": 
    case "py": return <SiPython className={`${className} text-[#3776AB]`} />;
    case "html":
    case "html5": return <SiHtml5 className={`${className} text-[#E34F26]`} />;
    case "css":
    case "css3": return <SiCss className={`${className} text-[#1572B6]`} />;
    case "vue":
    case "vuejs": return <SiVuedotjs className={`${className} text-[#4FC08D]`} />;
    case "angular": return <SiAngular className={`${className} text-[#DD0031]`} />;
    case "firebase": return <SiFirebase className={`${className} text-[#FFCA28]`} />;
    case "supabase": return <SiSupabase className={`${className} text-[#3ECF8E]`} />;
    case "mongodb":
    case "mongo": return <SiMongodb className={`${className} text-[#47A248]`} />;
    case "postgresql":
    case "postgres":
    case "sql": return <SiPostgresql className={`${className} text-[#4169E1]`} />;
    case "gcp":
    case "googlecloud": return <SiGooglecloud className={`${className} text-[#4285F4]`} />;
    case "vercel": return <SiVercel className={className} />;
    case "docker": return <SiDocker className={`${className} text-[#2496ED]`} />;
    case "git": return <SiGit className={`${className} text-[#F05032]`} />;
    case "graphql": return <SiGraphql className={`${className} text-[#E10098]`} />;
    case "prisma": return <SiPrisma className={`${className} text-[#2D3748]`} />;
    case "framer":
    case "framermotion": return <SiFramer className={`${className} text-[#0055FF]`} />;
    case "stripe": return <SiStripe className={`${className} text-[#008CDD]`} />;
    default:
      // Fallback icon for unknown skills
      return <Code2 className={`${className} text-muted`} />;
  }
}
