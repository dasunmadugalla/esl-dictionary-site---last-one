import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ioaghntmticvlwdxxhbf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvYWdobnRtdGljdmx3ZHh4aGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDQ4MDcsImV4cCI6MjA4NjcyMDgwN30.PWacR26KDlqJAQm9SKnWhjcuYo99TWDfVq8ExLjU0hE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);