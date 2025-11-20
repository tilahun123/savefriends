import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MealCard {
  id: string;
  meal_card_number: string;
  university: string;
  campus: string;
  status: string;
  created_at: string;
  taken_at: string | null;
}

const ClaimMealCard = () => {
  const [mealCards, setMealCards] = useState<MealCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all");
  const [selectedCampus, setSelectedCampus] = useState<string>("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchMealCards();
  }, []);

  const fetchMealCards = async () => {
    const { data, error } = await supabase
      .from("meal_cards")
      .select("*")
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

  // Get unique universities and campuses for filters
  const universities = ["all", ...new Set(mealCards.map(card => card.university))];
  const campuses = ["all", ...new Set(mealCards.map(card => card.campus))];

  // Filter cards
  const filteredCards = mealCards.filter(card => {
    const universityMatch = selectedUniversity === "all" || card.university === selectedUniversity;
    const campusMatch = selectedCampus === "all" || card.campus === selectedCampus;
    return universityMatch && campusMatch;
  });

  const availableCards = filteredCards.filter(card => card.status === "available");
  const claimedCards = filteredCards.filter(card => card.status === "taken");

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
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select university" />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((uni) => (
                    <SelectItem key={uni} value={uni}>
                      {uni === "all" ? "All Universities" : uni}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCampus} onValueChange={setSelectedCampus}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select campus" />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map((campus) => (
                    <SelectItem key={campus} value={campus}>
                      {campus === "all" ? "All Campuses" : campus}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            {/* Available Cards Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Available Cards</h2>
              {availableCards.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No meal cards available with the selected filters.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {availableCards.map((card) => (
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

            {/* Claimed Cards Section */}
            {claimedCards.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Claimed Cards</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {claimedCards.map((card) => (
                    <Card key={card.id} className="opacity-75">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{card.university}</CardTitle>
                            <CardDescription>{card.campus}</CardDescription>
                          </div>
                          <Badge variant="outline">Claimed</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Meal Card Number</p>
                          <p className="font-mono font-semibold blur-sm select-none">
                            {card.meal_card_number}
                          </p>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="mr-1 h-3 w-3" />
                          Claimed {card.taken_at ? new Date(card.taken_at).toLocaleDateString() : 'Recently'}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClaimMealCard;