import type { LucideIcon } from "lucide-react";
import {
  Droplet, Footprints, BookOpen, Flower2, HandHeart, Moon, Salad, Dumbbell,
  NotebookPen, Brush, Pill, Target, Music2, Ban, Coins, Sunrise, Heart,
  GraduationCap, Bike, Plus, Library, Brain, Palette, Sprout, Smile, Sun,
  Apple, Coffee, PhoneOff, Sparkles, PawPrint, Headphones,
} from "lucide-react";

export const ICONES_HABITO: { nome: string; Icone: LucideIcon }[] = [
  { nome: "Droplet", Icone: Droplet },
  { nome: "Footprints", Icone: Footprints },
  { nome: "BookOpen", Icone: BookOpen },
  { nome: "Flower2", Icone: Flower2 },
  { nome: "HandHeart", Icone: HandHeart },
  { nome: "Moon", Icone: Moon },
  { nome: "Salad", Icone: Salad },
  { nome: "Dumbbell", Icone: Dumbbell },
  { nome: "NotebookPen", Icone: NotebookPen },
  { nome: "Brush", Icone: Brush },
  { nome: "Pill", Icone: Pill },
  { nome: "Target", Icone: Target },
  { nome: "Music2", Icone: Music2 },
  { nome: "Ban", Icone: Ban },
  { nome: "Coins", Icone: Coins },
  { nome: "Sunrise", Icone: Sunrise },
  { nome: "Heart", Icone: Heart },
  { nome: "GraduationCap", Icone: GraduationCap },
  { nome: "Bike", Icone: Bike },
  { nome: "Plus", Icone: Plus },
  { nome: "Library", Icone: Library },
  { nome: "Brain", Icone: Brain },
  { nome: "Palette", Icone: Palette },
  { nome: "Sprout", Icone: Sprout },
  { nome: "Smile", Icone: Smile },
  { nome: "Sun", Icone: Sun },
  { nome: "Apple", Icone: Apple },
  { nome: "Coffee", Icone: Coffee },
  { nome: "PhoneOff", Icone: PhoneOff },
  { nome: "Sparkles", Icone: Sparkles },
  { nome: "PawPrint", Icone: PawPrint },
  { nome: "Headphones", Icone: Headphones },
];

export const MAPA_ICONES_HABITO = new Map(ICONES_HABITO.map((i) => [i.nome, i.Icone]));
