import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Users, UserCheck, UserX, Mail, Phone } from "lucide-react";
import { Navigate } from "react-router-dom";

const Funcionarios = () => {
  // Redirecionar para a nova tela de gerenciar funcionários
  return <Navigate to="/gerenciar-funcionarios" replace />;
};

export default Funcionarios;
