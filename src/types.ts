import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Client = {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  cpf_cnpj?: string;
  created_at: string;
};

export type ContactHistory = {
  id: string;
  date: string;
  type: 'email' | 'phone' | 'whatsapp' | 'visit' | 'other';
  notes: string;
};

export type Task = {
  id: string;
  title: string;
  status: 'backlog' | 'em_andamento' | 'concluida' | 'revisao';
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
};

export type Opportunity = {
  id: number;
  title: string;
  client_id: number;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  value: number;
  status: 'lead' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  description: string;
  contactHistory?: ContactHistory[];
  created_at: string;
};

export type Project = {
  id: number;
  name: string;
  client_id: number;
  client_name?: string;
  status: 'active' | 'completed' | 'on_hold' | 'won' | 'lost';
  budget: number;
  startDate: string;
  deadline: string;
  tasks?: Task[];
  created_at: string;
};

export type Transaction = {
  id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
  is_recurring: boolean;
  created_at: string;
};
