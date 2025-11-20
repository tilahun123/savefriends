import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const ShareMealCard = () => {
  const [mealCardNumber, setMealCardNumber] = useState("");
  const [university, setUniversity] = useState("");
  const [campus, setCampus] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to share a meal card.",
      });
      navigate("/auth");
      return;
    }

    const { error } = await supabase
      .from("meal_cards")
      .insert({
        meal_card_number: mealCardNumber,
        university,
        campus,
        shared_by: user.id,
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error sharing meal card",
        description: error.message,
      });
    } else {
      toast({
        title: "Success!",
        description: "Your meal card has been shared.",
      });
      setMealCardNumber("");
      setUniversity("");
      setCampus("");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Share Your Meal Card</CardTitle>
            <CardDescription>
              Help fellow students by sharing your meal card number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Input
                  id="university"
                  placeholder="e.g., Addis Ababa University"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campus">Campus</Label>
                <Input
                  id="campus"
                  placeholder="e.g., 5 Kilo Campus"
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mealCard">Meal Card Number</Label>
                <Input
                  id="mealCard"
                  placeholder="Enter your meal card number"
                  value={mealCardNumber}
                  onChange={(e) => setMealCardNumber(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sharing..." : "Share Meal Card"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShareMealCard;