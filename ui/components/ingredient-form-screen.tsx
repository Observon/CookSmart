"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CreateIngredientPayload, Ingredient, UpdateIngredientPayload } from "@/lib/types";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface IngredientFormScreenProps {
  onSave: (ingredient: CreateIngredientPayload | UpdateIngredientPayload) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
  editingIngredient?: Ingredient | null;
  loading?: boolean;
  existingIngredients?: Ingredient[];
}

const UNITS = ["kg", "g", "L", "ml", "unidade", "dúzia", "xícara", "colher (sopa)", "colher (chá)"];

export function IngredientFormScreen({
  onSave,
  onCancel,
  onDelete,
  editingIngredient,
  loading,
  existingIngredients = [],
}: IngredientFormScreenProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedUnit = unit || editingIngredient?.unitOfMeasure || "";

  useEffect(() => {
    if (editingIngredient) {
      setName(editingIngredient.name);
      setUnit(editingIngredient.unitOfMeasure);
      setTotalCost(editingIngredient.totalCost.toString());
      setTotalAmount(editingIngredient.totalAmount.toString());
    } else {
      setName("");
      setUnit("");
      setTotalCost("");
      setTotalAmount("");
    }
  }, [editingIngredient]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const normalizedName = name.trim().toLowerCase();
    const hasDuplicateName = existingIngredients.some((ingredient) => {
      if (!ingredient.name) {
        return false;
      }

      if (editingIngredient && ingredient.id === editingIngredient.id) {
        return false;
      }

      return ingredient.name.trim().toLowerCase() === normalizedName;
    });

    if (hasDuplicateName) {
      const message = "Já existe um ingrediente com esse nome. Escolha outro para continuar.";
      setError(message);
      toast.error(message);
      return;
    }

    if (!resolvedUnit) {
      const message = "Selecione uma unidade de medida para continuar.";
      setError(message);
      toast.error(message);
      return;
    }

    const parsedCost = Number.parseFloat(totalCost);
    const parsedAmount = Number.parseFloat(totalAmount);

    if (!Number.isFinite(parsedCost) || parsedCost <= 0 || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Informe valores válidos para custo e quantidade");
      return;
    }

    const payload: CreateIngredientPayload | UpdateIngredientPayload = editingIngredient
      ? {
          id: editingIngredient.id,
          name,
          unitOfMeasure: resolvedUnit,
          totalCost: parsedCost,
          totalAmount: parsedAmount,
          category: editingIngredient.category ?? undefined,
        }
      : {
          name,
          unitOfMeasure: resolvedUnit,
          totalCost: parsedCost,
          totalAmount: parsedAmount,
        };

    setSubmitting(true);
    try {
      await onSave(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível salvar o ingrediente";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const costPerUnit = (() => {
    const parsedCost = Number.parseFloat(totalCost);
    const parsedAmount = Number.parseFloat(totalAmount);

    if (!Number.isFinite(parsedCost) || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return "0.00";
    }

    return (parsedCost / parsedAmount).toFixed(2);
  })();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 py-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">{editingIngredient ? "Editar Ingrediente" : "Novo Ingrediente"}</h1>
          </div>
          {editingIngredient && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
        <Card className="p-5 space-y-4 bg-card">
          <div className="space-y-2">
            <Label htmlFor="ingredient-name" className="text-foreground">
              Nome do Ingrediente
            </Label>
            <Input
              id="ingredient-name"
              placeholder="Ex: Leite Condensado, Açúcar..."
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-12 text-base bg-background"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit" className="text-foreground">
              Unidade de Medida
            </Label>
            <Select value={resolvedUnit} onValueChange={setUnit} required>
              <SelectTrigger className="h-12 text-base bg-background">
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total-cost" className="text-foreground">
                Custo Total (R$)
              </Label>
              <Input
                id="total-cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={totalCost}
                onChange={(event) => setTotalCost(event.target.value)}
                className="h-12 text-base bg-background"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total-amount" className="text-foreground">
                Quantidade Total
              </Label>
              <Input
                id="total-amount"
                type="number"
                step="0.0001"
                min="0"
                placeholder="0"
                value={totalAmount}
                onChange={(event) => setTotalAmount(event.target.value)}
                className="h-12 text-base bg-background"
                required
              />
            </div>
          </div>
        </Card>

        {/* Cost Preview */}
        {totalCost && totalAmount && (
          <Card className="p-5 bg-accent/50 border-accent">
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">Custo por {unit || "unidade"}:</p>
              <p className="text-3xl font-bold text-primary">R$ {costPerUnit}</p>
            </div>
          </Card>
        )}

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        {/* Example */}
        <Card className="p-4 bg-muted/50">
          <p className="text-xs text-muted-foreground mb-2 font-semibold">💡 Exemplo:</p>
          <p className="text-xs text-muted-foreground">
            Se você comprou 1kg de açúcar por R$ 5,00, preencha:
            <br />• Custo Total: 5.00
            <br />• Quantidade Total: 1000 (em gramas)
            <br />• Unidade: g
          </p>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={submitting || loading}
        >
          {submitting || loading ? "Salvando..." : editingIngredient ? "Atualizar Ingrediente" : "Salvar Ingrediente"}
        </Button>
      </form>
    </div>
  );
}