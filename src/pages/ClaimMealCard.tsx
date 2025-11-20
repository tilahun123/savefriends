import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar } from "lucide-react";

interface MealCard {
  id: string;
  meal_card_number: string;
  university: string;
  campus: string;
  status: string;
  created_at: string;
}

const ClaimMealCard = () => {
  const [mealCards, setMealCards] = useState<MealCard[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchMealCards();
  }, []);

  const fetchMealCards = async () => {
    const { data, error } = await supabase
      .from("meal_cards")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading meal cards",
        description: error.message,
      });
    } else {
      setMealCards(data || []);
    }
    setLoading(false);
  };

  const handleClaim = async (cardId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to claim a meal card.",
      });
      navigate("/auth");
      return;
    }

    const { error } = await supabase
      .from("meal_cards")
      .update({
        status: "taken",
        taken_by: user.id,
        taken_at: new Date().toISOString(),
      })
      .eq("id", cardId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error claiming meal card",
        description: error.message,
      });
    } else {
      toast({
        title: "Success!",
        description: "Meal card claimed successfully.",
      });
      fetchMealCards();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Available Meal Cards</CardTitle>
            <CardDescription>
              Claim a meal card to access the university cafeteria
            </CardDescription>
          </CardHeader>
        </Card>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : mealCards.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No meal cards available at the moment. Check back later!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {mealCards.map((card) => (
              <Card key={card.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{card.university}</CardTitle>
                      <CardDescription>{card.campus}</CardDescription>
                    </div>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Meal Card Number</p>
                    <p className="font-mono font-semibold">{card.meal_card_number}</p>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    Shared {new Date(card.created_at).toLocaleDateString()}
                  </div>
                  <Button
                    onClick={() => handleClaim(card.id)}
                    className="w-full"
                  >
                    Claim This Card
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimMealCard;