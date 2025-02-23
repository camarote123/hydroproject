import { createClient } from "@supabase/supabase-js";


export const supabase=createClient(
    "https://gwpdficziacsggfhtsff.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cGRmaWN6aWFjc2dnZmh0c2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MDcxNzMsImV4cCI6MjA1MTQ4MzE3M30.k251ml-KLw4M7TTtcpZyHh659qoO0HI9wCNUihwzxqM")