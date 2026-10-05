export interface AdminInviteApplication {
  id: string;
  email: string;
  fullName: string;
  status: string;
  createdAt: string;
  internalNotes?: string;
  country?: string;
  timeZone?: string;
  profession?: string;
  experience?: string;
  portfolio?: string;
  linkedIn?: string;
  github?: string;
  whyJoin?: string;
  heardAboutUs?: string;
  skillsOffered: string[];
  skillsLookingFor: string[];
}
