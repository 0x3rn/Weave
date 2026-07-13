import { 
  SiNextdotjs, SiReact, SiTypescript, SiJavascript, SiTailwindcss, 
  SiFigma, SiNodedotjs, SiPython, SiHtml5, SiCss, SiVuedotjs,
  SiAngular, SiFirebase, SiSupabase, SiMongodb, SiPostgresql,
  SiGooglecloud, SiVercel, SiDocker, SiGit, SiGraphql,
  SiPrisma, SiFramer, SiStripe,
  SiFlutter, SiRust, SiSwift, SiKotlin, SiCplusplus,
  SiRuby, SiPhp, SiLaravel, SiDjango, SiSpring, SiGo,
  SiBlender, SiUnity, SiUnrealengine
} from "react-icons/si";
import { 
  Code2, Palette, PenTool, Layout, Box, Brush, Monitor, Smartphone, Video,
  Briefcase, ClipboardList, Database, Server, Megaphone, PenBox,
  LineChart, Calculator, FileText, Globe, Headset, Lock, Search,
  Wrench, Users, Camera, Music, BookOpen, Layers
} from "lucide-react";

export function SkillIcon({ skill, className = "w-5 h-5" }: { skill: string, className?: string }) {
  const name = skill.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  if (name.includes("stripe")) return <SiStripe className={`${className} text-[#008CDD]`} />;
  
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
    case "flutter": return <SiFlutter className={`${className} text-[#02569B]`} />;
    case "rust": return <SiRust className={`${className} text-black dark:text-white`} />;
    case "swift": return <SiSwift className={`${className} text-[#F05138]`} />;
    case "kotlin": return <SiKotlin className={`${className} text-[#7F52FF]`} />;
    case "c":
    case "c++":
    case "cplusplus": return <SiCplusplus className={`${className} text-[#00599C]`} />;
    case "c#":
    case "csharp": return <Code2 className={`${className} text-[#239120]`} />;
    case "ruby": return <SiRuby className={`${className} text-[#CC342D]`} />;
    case "php": return <SiPhp className={`${className} text-[#777BB4]`} />;
    case "laravel": return <SiLaravel className={`${className} text-[#FF2D20]`} />;
    case "django": return <SiDjango className={`${className} text-[#092E20]`} />;
    case "spring":
    case "springboot": return <SiSpring className={`${className} text-[#6DB33F]`} />;
    case "go":
    case "golang": return <SiGo className={`${className} text-[#00ADD8]`} />;
    case "adobexd":
    case "xd": return <Layout className={`${className} text-[#FF61F6]`} />;
    case "photoshop":
    case "adobephotoshop":
    case "ps": return <Brush className={`${className} text-[#31A8FF]`} />;
    case "illustrator":
    case "adobeillustrator":
    case "ai": return <PenTool className={`${className} text-[#FF9A00]`} />;
    case "blender": return <SiBlender className={`${className} text-[#F5792A]`} />;
    case "canva": return <Palette className={`${className} text-[#00C4CC]`} />;
    case "unity": return <SiUnity className={`${className} text-[#000000] dark:text-[#FFFFFF]`} />;
    case "unreal":
    case "unrealengine": return <SiUnrealengine className={`${className} text-[#000000] dark:text-[#FFFFFF]`} />;
    
    // Conceptual skills
    case "uidesign":
    case "uxdesign":
    case "uiux":
    case "uiuxdesign": return <Layout className={`${className} text-[#FF007F]`} />;
    case "graphicdesign":
    case "illustration": return <PenTool className={`${className} text-[#9333EA]`} />;
    case "3d":
    case "3dmodelling":
    case "3dmodeling":
    case "3ddesign": return <Box className={`${className} text-[#F59E0B]`} />;
    case "videoediting":
    case "videoproduction": return <Video className={`${className} text-[#EF4444]`} />;
    case "mobile":
    case "mobileapp":
    case "appdevelopment": return <Smartphone className={`${className} text-[#3B82F6]`} />;
    case "web":
    case "webdesign":
    case "webdevelopment": 
    case "responsive":
    case "responsivedesign": return <Monitor className={`${className} text-[#10B981]`} />;
    case "design": return <Palette className={`${className} text-[#E11D48]`} />;
    
    // Extensive conceptual skill mappings
    case "projectmanagement":
    case "pm":
    case "agile":
    case "scrum":
    case "productmanagement": return <ClipboardList className={`${className} text-[#14B8A6]`} />;
    case "marketing":
    case "digitalmarketing":
    case "socialmedia":
    case "seo":
    case "growth": return <Megaphone className={`${className} text-[#F43F5E]`} />;
    case "backend":
    case "backenddevelopment":
    case "api":
    case "apis": return <Server className={`${className} text-[#8B5CF6]`} />;
    case "frontend":
    case "frontenddevelopment":
    case "ui": return <Layout className={`${className} text-[#06B6D4]`} />;
    case "database":
    case "sql":
    case "nosql":
    case "data":
    case "dataanalysis":
    case "datascience": return <Database className={`${className} text-[#3B82F6]`} />;
    case "writing":
    case "copywriting":
    case "contentwriting":
    case "blogging":
    case "technicalwriting": return <PenBox className={`${className} text-[#F59E0B]`} />;
    case "sales":
    case "b2b":
    case "closing": return <Briefcase className={`${className} text-[#10B981]`} />;
    case "finance":
    case "accounting":
    case "bookkeeping": return <Calculator className={`${className} text-[#059669]`} />;
    case "analytics":
    case "dataanalytics":
    case "businessintelligence": return <LineChart className={`${className} text-[#6366F1]`} />;
    case "translation":
    case "languages":
    case "localization": return <Globe className={`${className} text-[#0EA5E9]`} />;
    case "customerservice":
    case "support":
    case "success": return <Headset className={`${className} text-[#EC4899]`} />;
    case "security":
    case "cybersecurity":
    case "infosec": return <Lock className={`${className} text-[#DC2626]`} />;
    case "research":
    case "marketresearch": return <Search className={`${className} text-[#64748B]`} />;
    case "engineering":
    case "hardware":
    case "electronics": return <Wrench className={`${className} text-[#94A3B8]`} />;
    case "hr":
    case "humanresources":
    case "recruiting":
    case "leadership":
    case "management": return <Users className={`${className} text-[#8B5CF6]`} />;
    case "photography":
    case "videography": return <Camera className={`${className} text-[#14B8A6]`} />;
    case "audio":
    case "music":
    case "sounddesign":
    case "audioediting": return <Music className={`${className} text-[#F43F5E]`} />;
    case "education":
    case "teaching":
    case "tutoring": return <BookOpen className={`${className} text-[#F59E0B]`} />;
    case "architecture":
    case "cad":
    case "drafting": return <Layers className={`${className} text-[#3B82F6]`} />;
    
    default:
      // Fallback icon for unknown skills
      return <Code2 className={`${className} text-muted`} />;
  }
}
